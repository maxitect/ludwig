---
name: orchestrate
description: Run one bounded orchestrator session for the Ludwig build. Merges 4 to 6 tickets through ticket-implementer and ticket-reviewer agents, then rewrites PROMPT.md for the next session. It runs `pnpm preflight` itself and refuses to start if that fails.
disable-model-invocation: true
---

# Orchestrator (Opus)

## Preflight, status and handover

The block below is `pnpm preflight`, then, only if preflight passed, `pnpm ticket:status` and `PROMPT.md`.

**If the block contains `PREFLIGHT FAIL`, show it to the user and stop. Do nothing else: no investigation, no fixes, no tool calls.**

!`(pnpm -s preflight && pnpm -s ticket:status && cat PROMPT.md) || true`

## Role

You orchestrate one bounded session of the Ludwig build: `ticket-implementer` agents build tickets, `ticket-reviewer` agents clear them, and you merge. Preflight verified Docker, Postgres, `gh`, a clean synced `main`, the migrated and seeded database and every gate, and swept merged tickets' worktrees, branches, databases and Neon branches. Don't re-check any of it.

`ticket:status` lists in-flight tickets (PR, report status, review verdict, worktree) and the tickets whose dependencies are all done, marked `MIG` and `HUMAN`. `PROMPT.md` holds what the README can't: in-flight context, decisions not to re-litigate, and open questions. Read the ticket index @docs/tickets/README.md only to update statuses. The agents carry their own protocol, so you don't need `docs/tickets/INSTRUCTIONS.md`; read it only to settle a dispute.

Scripts print one PASS line, or `FAIL: <step>`, a short tail and a log path. Read the log only when the tail isn't enough.

## Session scope

Take **4 to 6 tickets** through to merged, then wind down.

- Tickets already in flight count towards the total.
- Stop launching new tickets once 6 have been started, or when no ready ticket is left. Let everything in flight finish.
- Stop and ask the user only for what step 7 says to escalate.

## Protocol

1. **Resume** each in-flight ticket from `ticket:status`:
   - verdict `ALL CLEAR`: merge (step 5);
   - PR open, no verdict: launch the reviewer (step 4);
   - worktree with commits but no PR: continue the implementer with `SendMessage` if you still have its id, otherwise spawn a new implementer and tell it to resume in that worktree path;
   - nothing committed: re-dispatch the ticket fresh.
2. **Pick work** from the ready list, starting with the suggestion in `PROMPT.md`.
   - Run tickets in parallel only when they are independent. Keep about 3 implementers (plus their reviewers) in flight.
   - **One migration ticket at a time** (`MIG`), so migration order stays linear.
   - **One `SPEC.md`- or `CLAUDE.md`-editing ticket at a time.** Most feature tickets edit SPEC.
3. **Spawn the implementer:** `Agent` with `subagent_type: "ticket-implementer"` and `run_in_background: true`. The agent definition sets the model, the worktree and the protocol. The brief holds only:
   - the ticket path;
   - facts it needs from its dependencies' reports in `docs/tickets/reports/` (contract changes, file locations, gotchas), plus relevant decisions from `PROMPT.md`;
   - for `HUMAN` tickets, to do every repo-side step and then hand back, so you can ask the user to do the human steps before verification continues.
4. **Spawn the reviewer** when an implementer returns a PR: `subagent_type: "ticket-reviewer"`, with the PR URL, the ticket path and the worktree path. The reviewer replaces your own checks: don't re-run gates or ACs.
   - Implementer `BLOCKED` or reviewer `NOT CLEAR`: continue the reviewer (`SendMessage`) for unfinished fixes, or the implementer for missing scope. Escalate if it doesn't converge.
5. **Merge** with `pnpm ticket:merge <id>`, run with `run_in_background: true` (it may wait up to 20 minutes for preview checks). It checks the verdict, unpushed code, staleness against `main`, mergeability and CI. It then squash-merges, syncs `main` (migrating and seeding if needed), stages any unpushed reviewer docs on `main` for your status commit, and sweeps the worktree, branches, databases, dev server and Neon branch.
   - `FAIL: up to date with main` or `mergeable`: send the reviewer the reason to rebase, run the gates and push, then retry. For `package.json` conflicts take the union of both dependency lists; for `pnpm-lock.yaml`, `git checkout --theirs pnpm-lock.yaml && pnpm install --no-frozen-lockfile`, then confirm `pnpm install --frozen-lockfile` passes.
   - `FAIL: checks`: never merge over a failed check. A transient preview failure (`Connection terminated unexpectedly`, `ETIMEDOUT`, a `next/font/google` fetch) is recovered with `vercel redeploy <preview-url> --no-wait`, then retry. Otherwise send it to the reviewer.
   - `notify <branch>` lines: `SendMessage` that ticket's agent to rebase before its one push.
   - `check production build and runtime logs`: do it (`vercel inspect <url> --logs`, Vercel MCP `get_runtime_logs`).
   - A `neon: kept` note is fine: the next merge or preflight deletes it. If a new preview fails with "Resource provisioning failed", the 10-branch Neon cap was hit: run `pnpm ticket:cleanup`, then `vercel redeploy <preview-url> --no-wait`.
   - After the ticket that ends a milestone, give the user a short milestone summary, then carry on.
6. **Interrupted agents.** Agents die together on usage limits. `pnpm ticket:status` shows what survived; resume as in step 1.
7. **Escalate** to the user, rather than guess, when a ticket is `BLOCKED`, contradicts `SPEC.md`, or needs a decision that isn't in the docs. Before escalating anything about Vercel or Neon, investigate with the platform tools (INSTRUCTIONS §3.1) and bring only what needs the user's approval or access. Never stall the whole session on one ticket: park it, note it in `PROMPT.md` and move on.

## Wind down

When the session scope is met and nothing is in flight:

1. Update the status column in @docs/tickets/README.md for every ticket you touched.
2. Rewrite `PROMPT.md` (git-ignored, never committed) for the next orchestrator. Keep its section structure and update it in place:
   - **Where we are**: today's date, the session number, the done list, anything still in flight, and anything parked or blocked.
   - **Ready to start now**: a suggested next launch and the gotchas a ticket needs. `ticket:status` computes the ready list itself, so don't copy it.
   - **Decisions and conventions**: add the contracts, patterns and gotchas this session's reports established that later tickets rely on. Merge them into existing entries; don't append a diary.
   - **Open questions for the user**: add new ones and remove resolved ones.
3. Commit the README and any staged reviewer docs in one commit, and push. `main` must be clean and level with `origin` when you finish, or the next preflight refuses to start.
4. Reply to the user with a short summary: tickets merged, tickets in flight or parked, and anything they need to decide.
