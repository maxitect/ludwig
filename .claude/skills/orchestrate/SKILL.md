---
name: orchestrate
description: Run one bounded orchestrator session for the Ludwig build. Merges 4 to 6 tickets through Sonnet implementers and Opus reviewers, then rewrites PROMPT.md for the next session. It runs `pnpm preflight` itself and refuses to start if that fails.
disable-model-invocation: true
---

# Orchestrator (Opus)

## Preflight and handover

The block below is produced by `pnpm preflight`, followed by `PROMPT.md` only if preflight passed.

**If the block contains `PREFLIGHT FAIL`, show it to the user and stop. Do nothing else: no investigation, no fixes, no tool calls.**

!`(pnpm -s preflight && cat PROMPT.md) || true`

## Role

You orchestrate one bounded session of the Ludwig build: implementers (Sonnet) build tickets, reviewers (Opus) clear them, you merge. The preflight above verified Docker, Postgres, `gh`, a clean synced `main`, the migrated and seeded database and every gate. Don't re-check any of it.

The handover above (`PROMPT.md`) holds the current state, what is in flight, which tickets are ready, the decisions not to re-litigate and the open questions. Also read:

- @docs/tickets/README.md: the ticket index and status. It is the source of truth.
- @docs/tickets/INSTRUCTIONS.md: the protocol for implementers and reviewers (§2), the local environment (§3), the platform tools (§3.1), the report format (§4) and the ticket format (§5).
- @docs/SPEC.md and @docs/PLAN.md: what we build, and the definition of done. Don't read them in full; tickets cite sections.

If `@` files didn't load, `Read` them.

## Session scope

Take **4 to 6 tickets** through to merged, then wind down.

- Tickets already in flight in `PROMPT.md` count towards the total.
- Stop launching new tickets once 6 have been started, or when no ready ticket is left. Let everything in flight finish.
- Stop and ask the user only for what step 8 says to escalate.

## Protocol

1. **Resume.** For each in-flight ticket in `PROMPT.md`, check `gh pr view <n>` and its report in `docs/tickets/reports/<id>.md`.
   - `## Review` says ALL CLEAR: go to step 6.
   - PR open, no verdict: launch the reviewer (step 5).
   - Worktree gone and nothing committed: re-dispatch the ticket fresh (step 9).
2. **Pick work.** Choose tickets whose `depends_on` are all `done` in the README, starting with the "Ready to start now" list in `PROMPT.md`.
   - Run tickets in parallel only when they are independent, each in its own worktree. Keep about 3 implementers (plus their reviewers) in flight.
   - Run **one migration ticket at a time** (`Mig` column, `migrations: true`). Migration order must stay linear.
3. **Brief the implementer.** Spawn it with `model: "sonnet"` and `isolation: "worktree"`, and give it:
   - the ticket path, and its environment from INSTRUCTIONS §3 with the id and port filled in;
   - the facts it needs from its dependencies' reports in `docs/tickets/reports/` (contract changes, file locations, gotchas), plus any relevant decision from `PROMPT.md`;
   - an instruction to follow INSTRUCTIONS §2.1–2.4;
   - the one-push rule: commit early and often, but push once, via `/pr-prep`, after every gate and every non-`deploy` AC passes locally. Nobody polls or waits for CI.
4. **Human tickets.** For `requires_human: true`, have the implementer do every repo-side step, then ask the user to do the human steps before verification continues.
5. **Launch the reviewer** when an implementer returns a PR: `model: "opus"`, no `isolation` (it works in the implementer's worktree). Brief it with the PR URL, the ticket path, the worktree path and its environment, and an instruction to follow INSTRUCTIONS §2.5. Reviewers fix and re-review locally and push once at the end.
   - The reviewer replaces your own checks. Don't re-run gates or ACs.
   - Implementer `BLOCKED`, or reviewer `NOT CLEAR`: continue the reviewer (`SendMessage`) for unfinished fixes, or the implementer for missing scope. Escalate if it doesn't converge.
6. **Merge** only on `ALL CLEAR`.
   - **Don't re-push just to rebase.** If `gh pr view <n> --json mergeable` says `MERGEABLE` and `main` only gained docs or unrelated code, squash-merge as is. Rebase only on a real conflict, or when `main` gained a migration or changed files the PR also touches; then run the gates locally before pushing. `package.json` conflicts: take the union of both dependency lists. `pnpm-lock.yaml` conflicts: `git checkout --theirs pnpm-lock.yaml && pnpm install --no-frozen-lockfile`, then confirm `pnpm install --frozen-lockfile` passes. Any code conflict goes back to the reviewer.
   - Check CI once with `gh pr checks <n>`. Merge if it passed, or is still running on a commit whose gates the reviewer ran green locally. Never merge over a **failed** check, and don't poll.
   - Squash-merge with `gh pr merge <n> --squash --delete-branch` and a single-line Conventional Commit title including the ticket ID. No AI attribution.
   - **Clean up:** remove the worktree (`git worktree remove -f -f <path>`), delete the local `ticket/<id>-<slug>` and `worktree-agent-*` branches, drop `ludwig_<id>` and `ludwig_<id>_test`, and delete the merged PR's Neon preview branch `preview/ticket/<id>-<slug>` (`neonctl branches delete <branch-id> --project-id bold-term-80947033`). The Neon plan caps the project at **10 branches**; once it's reached, new previews fail with "Resource provisioning failed", and you recover with `vercel redeploy <preview-url> --no-wait` after cleaning up. The user has approved deleting merged tickets' preview branches. Never delete `main` or an open PR's branch.
   - Sync `main`: `git pull && pnpm install --frozen-lockfile`, plus `pnpm db:migrate && pnpm db:seed` if a migration or content landed.
   - For tickets that touch auth, env, config, routing, caching, migrations or content, check production's build and runtime logs after the merge (INSTRUCTIONS §3.1).
   - Tell in-flight agents with `SendMessage` when a merge changes a contract they depend on, or when `main` gains a migration or touches files their PR edits, so they rebase before their one push.
   - After the ticket that ends a milestone, give the user a short milestone summary, then carry on.
7. **Shared doc edits.** Some tickets edit `docs/SPEC.md` or `CLAUDE.md`, and only the sections they name. Don't run two such tickets in parallel, and rebase onto `main` before merging them. A reviewer may leave a docs-only commit unpushed to save a preview build; copy that file onto `main` in your status commit.
8. **Escalate** to the user, rather than guess, when a ticket is `BLOCKED`, contradicts `SPEC.md`, or needs a decision that isn't in the docs. Before escalating anything about Vercel or Neon, investigate with the platform tools (INSTRUCTIONS §3.1) and bring only what needs the user's approval or access. Never stall the whole session on one ticket: park it, note it in `PROMPT.md` and move on.
9. **Interrupted agents.** Agents die together on usage limits. Before resuming one, check its worktree still exists with commits: if so `SendMessage` it, otherwise re-dispatch the ticket fresh.

## Wind down

When the session scope is met and nothing is in flight:

1. Update the status column in @docs/tickets/README.md for every ticket you touched.
2. Rewrite `PROMPT.md` for the next orchestrator. Keep its section structure and update it in place:
   - **Where we are**: today's date, the session number, the done list, anything still in flight (PR, worktree, report, what's left), and anything parked or blocked.
   - **Ready to start now**: recompute from the README, marking migration tickets, with a suggested next launch and any gotchas a ticket needs.
   - **Decisions and conventions**: add contracts, patterns and gotchas this session's reports established that later tickets rely on. Merge them into existing entries; don't append a diary.
   - **Open questions for the user**: add new ones, remove resolved ones.
3. Commit the README and PROMPT.md changes in one commit and push. `main` must be clean and level with `origin` when you finish, or the next preflight will refuse to start.
4. Reply to the user with a short summary: tickets merged, tickets in flight or parked, and anything they need to decide.
