# Ticket Execution Instructions

This file is the shared reference for the agentic build. The roles live elsewhere:

- **Orchestrator:** the `/orchestrate` skill, `.claude/skills/orchestrate/SKILL.md`. It runs `pnpm preflight` itself and rewrites `PROMPT.md` (git-ignored) when the session ends.
- **Implementer:** `.claude/agents/ticket-implementer.md` (Sonnet, own worktree).
- **Reviewer:** `.claude/agents/ticket-reviewer.md` (Opus, in the implementer's worktree).

Everything about _what_ to build and _how the code should look_ lives in:

- `docs/SPEC.md`: the product, puzzle rules, design system and data model. Tickets cite sections as `SPEC §x.y`.
- `docs/PLAN.md`: milestones, principles and the definition of done (`PLAN §5.3`).
- `CLAUDE.md` and `.claude/rules/*.md`: coding rules. These load automatically.
- `.claude/skills/`: `/new-puzzle-type`, `/db-trigger` and `/zod4`.

Do not restate those documents in reports or code comments. Follow them.

The ticket index and dependency order are in `README.md`, in this folder.

## 1. Scripts

Each prints one `PASS` line, or `FAIL: <step>`, the last lines of output and the path of the full log. Read the log only when the tail isn't enough.

| Script | Who runs it | What it does |
|---|---|---|
| `pnpm ticket:setup <id>` | implementer, in its worktree | Names the branch `ticket/<id>-<slug>`, installs, creates `ludwig_<id>`, writes `.env.local`, migrates and seeds. Idempotent |
| `pnpm ticket:gates` | implementer, reviewer | typecheck, lint, test, build, `puzzles:verify`; records the tree they passed on in `.verification/<id>/gates.ok` |
| `pnpm ticket:stop-check` | implementer's Stop hook | Blocks finishing until the report is committed, the gates passed on the current code and the PR is open and pushed |
| `pnpm ticket:status` | orchestrator | In-flight tickets (PR, report, verdict, worktree) and the tickets whose dependencies are all done |
| `pnpm ticket:merge <id>` | orchestrator | Verdict, staleness, mergeability and CI checks, then squash-merge, sync `main` and sweep |
| `pnpm ticket:cleanup` | orchestrator, preflight | Sweeps every merged ticket's worktree, branches, databases, dev server and Neon preview branch |

## 2. Verification

### 2.1 Gates

`pnpm ticket:gates` must pass before AC verification and before every push. A test that fails is a failed AC.

### 2.2 Methods

Each AC names one or more methods. Each method has a set of tools you must use; mocks are not a substitute.

| Method | How to verify | Evidence to capture |
|---|---|---|
| `db` | Query the local database directly: `psql "$DATABASE_URL" -c "…"`. Use transactions for negative tests (`BEGIN; … ; ROLLBACK;`) | The exact SQL plus its output, including error messages for expected failures |
| `api` | Run the dev server (section 3) and call it with `curl -i`. For a deployed preview, use `vercel curl` (section 3.1). For Better Auth, use `POST /api/auth/sign-up/email` and `/sign-in/email` with JSON, keep cookies with `-c/-b cookies.txt`, and post Server Actions through the page (a browser test) rather than by hand-crafting action IDs | The command plus the status line and relevant headers and body |
| `browser` | Prefer an isolated headless `@playwright/test` script against the dev server (section 3). With the Playwright MCP: `browser_navigate`, `browser_snapshot` before interacting, then `browser_click`/`browser_type`, and `browser_console_messages` to check for errors. Take a `browser_take_screenshot` for anything visual | The snapshot excerpt or screenshot path, and console errors (must be none unless the AC allows them) |
| `next` | Next devtools MCP: `nextjs_index` and `nextjs_call` to inspect routes, build and runtime errors | The tool output excerpt |
| `unit` | Vitest. The named test file must exist and pass | The test names and the pass output |
| `cli` | Run the named script or command | The command plus its output and exit code |
| `deploy` | Platform tools (section 3.1) against the PR's preview, or production after merge: `vercel inspect --logs`, Vercel MCP `get_runtime_logs`, `vercel curl`, a share link plus a headless browser, and Neon MCP `run_sql` on the deployment's branch | The command or tool call plus its output, including the deployment URL and Neon branch name |
| `code` | Static check of the source with `grep` or by reading files, for structural rules such as "no `jsonb` columns" or "no solution columns selected in `load.ts`" | The command plus its output |

General rules:

- **Visual ACs** (brand, layout) need a screenshot in **both themes** (Paper and Ink) and at **two widths**, 1280px and 390px.
- **Negative ACs** ("X must fail") need proof that the failure happens _and_ that the valid path still succeeds.
- **Server logs.** Before reporting, check the dev server output for errors and warnings, and use the `next` method to confirm there are no runtime errors.

---

## 3. Local environment

There is one local Postgres container, from `compose.yaml` (created in T001). Each ticket gets an isolated database and port, so implementers can run in parallel:

| Item | Value |
|---|---|
| Database | `ludwig_<id>`, e.g. `ludwig_t019`, on the shared container `ludwig-db-1`. Dropped by the merge sweep |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | `postgres://ludwig:ludwig@localhost:5432/ludwig_<id>` in the worktree's `.env.local` |
| Dev server port | `3000 + <numeric id>`, e.g. T019 uses 3019. Run `pnpm dev --port <port>` in the background, and stop it when you're done |
| `BETTER_AUTH_URL` | `http://localhost:<port>` |
| Verification artefacts | `.verification/<id>/` inside the worktree, which is git-ignored: screenshots, cookies, logs |

`pnpm ticket:setup <id>` does the setup. Never hand-roll it; if it fails, fix the cause and re-run it.

Rules:

- Never print `.env.local` or `BETTER_AUTH_SECRET`, and never modify the main checkout's `.env.local`.
- `.env.neon.local` holds the Neon production credentials as a reference for the user. Never read, copy or source it. The local app and tests always run against local Postgres, never Neon; production migrations only run in the Vercel build.
- Never `docker compose down` or recreate the container. If it's stopped, run `docker compose up -d` from the repo root.
- Kill only your own dev server, by port: `lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`. Never `pkill -f next`.
- **Browser checks:** parallel agents hijack the shared Playwright MCP tab, so prefer an isolated headless `@playwright/test` script. Themes are `data-theme="paper"` and `data-theme="ink"`.

### 3.1 Vercel and Neon tools

The Vercel and Neon MCP plugins and CLIs are installed and authenticated for the orchestrator and every implementer. You **should** use them: they are the default way to learn anything about deployments and the hosted database. Never ask the user for logs, env var names, deployment status or database state that these tools can fetch.

| Tool | What it's for |
|---|---|
| Vercel MCP (`mcp__plugin_vercel_vercel__*`) | Projects, deployments, build and runtime logs (`get_runtime_logs`), env var names, share links for protected previews (`get_access_to_vercel_url`). Team `team_711GDPInJ7HPDPbaBtUXNPZh` (`maxitects-projects`), project `prj_LjiTaW3OEqx9y01sCWPpXeBUM86I` (`ludwig`) |
| Vercel CLI (`vercel`, authenticated) | `vercel inspect <url> --logs` for build logs; `vercel curl --yes --deployment <url> <path> -- <curl args>` to call a protected preview; `vercel env ls --project ludwig` (names only) |
| Neon CLI (`neonctl`, authenticated) | `neonctl branches list --project-id bold-term-80947033`, `neonctl connection-string <branch> --project-id ...` (never print or commit it), and branch inspection |
| Neon MCP (`mcp__plugin_neon_neon__*`) | Org `org-muddy-term-88500580` (Vercel-managed), project `bold-term-80947033` (`ludwig-db`, eu-west-2). `main` is production; each preview deployment gets its own branch, named `preview/<git-branch>` |

Rules:

- **Previews:** every pushed PR branch gets a preview deployment and its own Neon branch. Verify deployed ACs there: `vercel curl` for API checks, a `get_access_to_vercel_url` share link for browser checks. Sign up test users on previews only. Each push costs a preview build and a CI run, so push as few times as possible (the agent files).
- **Neon reads:** read-only SQL (`run_sql` with `SELECT`) on any branch, including production `main`, is allowed for verification. Pass `branch_id` for preview branches.
- **Neon writes:** writing SQL is allowed on preview branches. On production `main`, any write, delete or schema change, and every destructive Neon operation (deleting branches, resetting, dropping), needs the user's explicit approval first. Implementers ask the orchestrator, and the orchestrator asks the user. The one standing exception: the orchestrator deletes a merged ticket's preview branch during cleanup (`pnpm ticket:merge` and `pnpm ticket:cleanup`).
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

## Review

Verdict: ALL CLEAR | NOT CLEAR
PR: #<n>
Rounds: <n>

| Finding | Severity | Resolution |
|---|---|---|
| <short title> | critical/warning/suggestion | fixed in <sha> / open: <reason> |

Re-verified: AC<n> (<method>) PASS, … · gates ✔
```

- Evidence must be real output, trimmed to the decisive lines. Never paraphrase it.
- If an AC is `BLOCKED`, say what was tried, the root-cause hypothesis and what is needed to unblock it.

---

## 5. Ticket file format

See `_TEMPLATE.md`. The frontmatter keys are `id`, `title`, `milestone`, `epic`, `depends_on`, `migrations`, `requires_human`, `spec` and `skills`. Acceptance criteria are numbered `AC1…ACn`. Each AC has a `Verify (<method>)` line that says exactly what to run and what result is expected.
