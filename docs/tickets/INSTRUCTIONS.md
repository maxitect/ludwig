# Ticket Execution Instructions

This file is for the agentic build system: an **Opus orchestrator** and **Sonnet implementers**. It defines only the execution protocol. Everything about _what_ to build and _how the code should look_ lives in:

- `docs/SPEC.md`: the product, puzzle rules, design system and data model. Tickets cite sections as `SPEC §x.y`.
- `docs/PLAN.md`: milestones, principles and the definition of done (`PLAN §5.3`).
- `CLAUDE.md` and `.claude/rules/*.md`: coding rules. These load automatically.
- `.claude/skills/`: `/new-puzzle-type`, `/db-trigger` and `/zod4`.

Do not restate those documents in reports or code comments. Follow them.

The ticket index and dependency order are in `README.md`, in this folder.

---

## 1. Orchestrator (Opus)

1. **Pick work.** Choose tickets whose `depends_on` are all `done` in `README.md`.
   - Tickets in the same milestone with no dependency between them may run in parallel, each in its own git worktree.
   - Don't run two tickets in parallel if both create migrations. Migration order must stay linear, so serialise those even when `depends_on` allows parallelism. Tickets with `migrations: true` in their frontmatter are the ones affected.
2. **Brief the implementer.** Give each one:
   - the ticket path and its isolated environment (section 3);
   - an instruction to follow section 2 of this file.
3. **Human tickets.** For `requires_human: true`, have the implementer do every repo-side step. Then pause and ask the user to perform the listed human steps before verification continues.
4. **Review the report** (section 4):
   - Reject any report where an AC lacks reproducible evidence, or where an AC is marked PASS on the strength of unit tests alone when it specifies another method.
   - **Spot-check.** Re-run at least one AC verification yourself, plus any you doubt.
   - If anything fails, send the ticket back to the implementer with the failing evidence.
5. **Merge.**
   - Squash-merge the ticket branch into `main` with a Conventional Commit title that includes the ticket ID.
   - Set the ticket's status in `README.md` to `done`.
   - Run the gates on `main` once after each merge.
6. **Shared doc edits.**
   - Some tickets edit `docs/SPEC.md` (decision records, new §7.4.5 rows) or `CLAUDE.md`. They may edit only the sections they name.
   - Don't run two such tickets in parallel.
   - Rebase onto `main` before merging, so doc edits never clobber each other.
7. **Escalate** to the user, rather than guess, when a ticket:
   - is `BLOCKED`;
   - contradicts `SPEC.md`;
   - or needs a decision that isn't in the docs.

---

## 2. Implementer (Sonnet)

### 2.1 Before coding

- Read the whole ticket, then every `SPEC §` and doc it cites. Read `node_modules/next/dist/docs/` for any Next.js API you touch.
- Invoke the skills listed in the ticket's `skills` frontmatter.
- Read 2–3 existing files of the same kind before creating a new one, and match their patterns.
- Work only on your branch, `ticket/<id>-<slug>`.
- Stay strictly within the ticket's **In scope**. If something out of scope is needed, stop and report it; don't do it.

### 2.2 Implementation loop

```
implement → gates → verify every AC → all PASS? → report
                           ↑                 │ no
                           └── fix ← diagnose┘
```

1. **Implement** the scope.
2. **Gates.** All of these must be green before AC verification:

   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```

   Also run `pnpm puzzles:verify` once that script exists, if content or puzzle code changed.
3. **Verify each AC.** Use the method stated in the AC (section 2.3). Capture the evidence as you go.
4. **On any failure:**
   - Diagnose the root cause, fix it, then re-run the gates.
   - Re-verify **every** AC, not only the one that failed, because fixes regress other criteria.
   - A test that fails is a failed AC. Never weaken an AC, a test or an assertion to make it pass.
5. **Iteration cap.** After 5 full verify cycles with any AC still failing, stop. Report the ticket as `BLOCKED`, with your diagnosis.

### 2.3 Verification methods

Each AC names one or more methods. Each method has a set of tools you must use; mocks are not a substitute.

| Method | How to verify | Evidence to capture |
|---|---|---|
| `db` | Query the local database directly: `psql "$DATABASE_URL" -c "…"`. Use transactions for negative tests (`BEGIN; … ; ROLLBACK;`) | The exact SQL plus its output, including error messages for expected failures |
| `api` | Run the dev server (section 3) and call it with `curl -i`. For a deployed preview, use `vercel curl` (section 3.1). For Better Auth, use `POST /api/auth/sign-up/email` and `/sign-in/email` with JSON, keep cookies with `-c/-b cookies.txt`, and post Server Actions through the page (a browser test) rather than by hand-crafting action IDs | The command plus the status line and relevant headers and body |
| `browser` | Use the Playwright MCP against the dev server: `browser_navigate`, `browser_snapshot` before interacting, then `browser_click`/`browser_type`, and `browser_console_messages` to check for errors. Take a `browser_take_screenshot` for anything visual | The snapshot excerpt or screenshot path, and console errors (must be none unless the AC allows them) |
| `next` | Next devtools MCP: `nextjs_index` and `nextjs_call` to inspect routes, build and runtime errors | The tool output excerpt |
| `unit` | Vitest. The named test file must exist and pass | The test names and the pass output |
| `cli` | Run the named script or command | The command plus its output and exit code |
| `code` | Static check of the source with `grep` or by reading files, for structural rules such as "no `jsonb` columns" or "no solution columns selected in `load.ts`" | The command plus its output |

General rules:

- **Visual ACs** (brand, layout) need a screenshot in **both themes** (Paper and Ink) and at **two widths**, 1280px and 390px.
- **Negative ACs** ("X must fail") need proof that the failure happens _and_ that the valid path still succeeds.
- **Server logs.** Before reporting, check the dev server output for errors and warnings, and use the `next` method to confirm there are no runtime errors.

### 2.4 Finish

1. Write the report to `docs/tickets/reports/<id>.md` (format in section 4) and commit it on the ticket branch.
2. Commit using Conventional Commits, scoped and referencing the ticket, e.g. `feat(gears): engine core (T034)`. Don't merge.
3. Return the report's summary table to the orchestrator.

---

## 3. Local environment

There is one local Postgres container, from `compose.yaml` (created in T001). Each ticket gets an isolated database and port, so implementers can run in parallel:

| Item | Value |
|---|---|
| Database | `ludwig_<id>`, e.g. `ludwig_t019`, created with `createdb` against the container. Drop it after the ticket merges |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | `postgres://ludwig:ludwig@localhost:5432/ludwig_<id>` in the worktree's `.env.local` |
| Dev server port | `3000 + <numeric id>`, e.g. T019 uses 3019. Run `pnpm dev --port <port>` in the background, and stop it when you're done |
| `BETTER_AUTH_URL` | `http://localhost:<port>` |
| Verification artefacts | `.verification/<id>/`, which is git-ignored: screenshots, cookies, logs |

Set up a fresh environment with `pnpm db:migrate && pnpm db:seed`. `.env.neon.local` holds the Neon production credentials as a reference for the user. Never read, copy or source it. The local app and tests always run against local Postgres, never Neon; production migrations only run in the Vercel build.

### 3.1 Vercel and Neon tools

The orchestrator and implementers have direct access to the hosted platform. Use these instead of asking the user for logs or dashboard checks.

| Tool | What it's for |
|---|---|
| Vercel MCP (`mcp__plugin_vercel_vercel__*`) | Projects, deployments, build and runtime logs (`get_runtime_logs`), env var names, share links for protected previews (`get_access_to_vercel_url`). Team `team_711GDPInJ7HPDPbaBtUXNPZh` (`maxitects-projects`), project `prj_LjiTaW3OEqx9y01sCWPpXeBUM86I` (`ludwig`) |
| Vercel CLI (`vercel`, authenticated) | `vercel inspect <url> --logs` for build logs; `vercel curl --yes --deployment <url> <path> -- <curl args>` to call a protected preview; `vercel env ls --project ludwig` (names only) |
| Neon MCP (`mcp__plugin_neon_neon__*`) | Org `org-muddy-term-88500580` (Vercel-managed), project `bold-term-80947033` (`ludwig-db`, eu-west-2). `main` is production; each preview deployment gets its own branch, named `preview/<git-branch>` |

Rules:

- **Previews:** every pushed PR branch gets a preview deployment and its own Neon branch. Verify deployed ACs there: `vercel curl` for API checks, a `get_access_to_vercel_url` share link for browser checks. Sign up test users on previews only.
- **Neon reads:** read-only SQL (`run_sql` with `SELECT`) on any branch, including production `main`, is allowed for verification. Pass `branch_id` for preview branches.
- **Neon writes:** writing SQL is allowed on preview branches. On production `main`, any write, delete or schema change, and every destructive Neon operation (deleting branches, resetting, dropping), needs the user's explicit approval first. Implementers ask the orchestrator, and the orchestrator asks the user.
- **Vercel changes:** reads are always fine. Changing project settings, env vars, protection or domains needs the user's approval, except that the orchestrator may add a missing per-environment secret generated with `openssl rand` and piped straight in, without printing it.
- **Secrets:** never print secret values, never decrypt env vars, and never copy credentials into the repo.

**Test users:**

- Create them through the Better Auth sign-up endpoint, using `<id>-<n>@test.local` emails and password `correct-horse-battery`.
- Never insert into `user` or `account` directly.
- Vitest integration tests may create users server-side with `auth.api.signUpEmail({ body })`. That goes through Better Auth, which is allowed. Raw inserts are not.

---

## 4. Report format

`docs/tickets/reports/<id>.md`:

```markdown
# <id> report: <title>

Status: DONE | BLOCKED
Branch: ticket/<id>-<slug>
Verify cycles: <n>

## Summary table

| AC | Result | Method | Evidence |
|---|---|---|---|
| AC1 | PASS | db | see AC1 below |
| AC2 | FAIL→PASS (cycle 2) | browser | .verification/<id>/ac2-paper-1280.png |

## Gates

typecheck ✔ · lint ✔ · test ✔ (N passed) · build ✔ · puzzles:verify ✔/n.a.

## Evidence

### AC1
<command>
<trimmed output>

## Deviations and follow-ups

- Anything out of scope noticed, any SPEC ambiguity, and any SPEC.md edit made (cite the section).
```

- Evidence must be real output, trimmed to the decisive lines. Never paraphrase it.
- If an AC is `BLOCKED`, say what was tried, the root-cause hypothesis and what is needed to unblock it.

---

## 5. Ticket file format

See `_TEMPLATE.md`. The frontmatter keys are `id`, `title`, `milestone`, `epic`, `depends_on`, `migrations`, `requires_human`, `spec` and `skills`. Acceptance criteria are numbered `AC1…ACn`. Each AC has a `Verify (<method>)` line that says exactly what to run and what result is expected.
