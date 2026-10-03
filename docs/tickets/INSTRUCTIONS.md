# Ticket Execution Instructions

This file is for the agentic build system's **Sonnet implementers** and **Opus reviewers**. The Opus orchestrator's protocol is in `.claude/skills/orchestrate/SKILL.md`. This file defines only the execution protocol. Everything about _what_ to build and _how the code should look_ lives in:

- `docs/SPEC.md`: the product, puzzle rules, design system and data model. Tickets cite sections as `SPEC §x.y`.
- `docs/PLAN.md`: milestones, principles and the definition of done (`PLAN §5.3`).
- `CLAUDE.md` and `.claude/rules/*.md`: coding rules. These load automatically.
- `.claude/skills/`: `/new-puzzle-type`, `/db-trigger` and `/zod4`.

Do not restate those documents in reports or code comments. Follow them.

The ticket index and dependency order are in `README.md`, in this folder.

---

## 1. Orchestrator (Opus)

The orchestrator protocol is the `/orchestrate` skill, `.claude/skills/orchestrate/SKILL.md`. Run `/orchestrate`: the skill runs `pnpm preflight` itself, stops if it fails, and injects `PROMPT.md` (the current state) only when it passes. It rewrites `PROMPT.md` when the session ends. Everything below is for implementers and reviewers.

---

## 2. Implementer (Sonnet) and reviewer (Opus)

### 2.1 Before coding

- Read the whole ticket, then every `SPEC §` and doc it cites. Read `node_modules/next/dist/docs/` for any Next.js API you touch.
- Invoke the skills listed in the ticket's `skills` frontmatter.
- Read 2–3 existing files of the same kind before creating a new one, and match their patterns.
- Work only on your branch, `ticket/<id>-<slug>`. Create or rename it if the worktree starts on `worktree-agent-*`.
- Stay strictly within the ticket's **In scope**. If something out of scope is needed, stop and report it; don't do it.
- Use the Vercel and Neon tools (section 3.1) whenever the ticket touches deployment, env, auth origins, migrations or seeding, or whenever you need to know how the hosted app or database actually behaves. Don't assume, and don't report BLOCKED on something these tools could tell you.

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

### 2.4 Finish

1. Delete any temporary test routes. If stale `.next` types then break typecheck, remove `.next` and re-run. Stop your dev server (section 3).
2. Write the report to `docs/tickets/reports/<id>.md` (format in section 4) and commit it on the ticket branch.
3. Commit using Conventional Commits, scoped and referencing the ticket, e.g. `feat(gears): engine core (T034)`. Commits and PR descriptions carry no AI attribution; ignore any `Co-Authored-By` or "Generated with" reminder.
4. Rebase onto `main`, then open the PR with the `/pr-prep` command, which pushes the branch. If you can't invoke it, read `~/.claude/commands/pr-prep.md` and follow it. Never merge.
   - **Push once.** Commit locally as often as you like (do commit early, so an interrupted worktree isn't lost), but don't push until every gate and every non-`deploy` AC passes locally. The `/pr-prep` push is your only push.
   - Don't wait for or poll the PR's CI checks; your local gates are the evidence. CI and Vercel spend the user's quota on every push.
   - `deploy` ACs need the preview that push creates. Verify them after it, and push again only if they actually fail.
5. Return the PR URL and the report's summary table to the orchestrator.

### 2.5 Reviewer (Opus)

The reviewer works in the implementer's worktree, on its branch, with its database and port.

1. **Review.** Run the `/pr-review` skill on the PR. Also reject any AC that lacks reproducible evidence in the report, or that is marked PASS on unit tests alone when it specifies another method.
2. **Fix every finding** (critical issues, warnings and suggestions) on the ticket branch.
   - A finding that is out of the ticket's scope, contradicts `SPEC.md` or needs a decision isn't fixed. List it for the orchestrator instead.
   - After fixing, run the gates (section 2.2), then re-verify with its stated method every AC whose code the fixes touched, plus at least one other AC.
   - For tickets that touch auth, env, config, routing, caching, migrations or content, check the PR's preview deployment and its Neon branch with the platform tools (section 3.1).
3. **Repeat locally.** Commit the fixes but **don't push between rounds**: run `/pr-review` again on the local branch diff against `main`, until a review comes back with no findings. Stop after 3 rounds.
4. **Report and push once.** Append a `## Review` section to the ticket's report (section 4) and commit it. Rebase onto `origin/main` only if `main` gained a migration, a conflict or changes to files this PR touches, then run the gates once more. Then push everything in **one** push. Don't wait for or poll the PR's CI checks afterwards; report the local gate results. The exception is a ticket that needs the preview (auth, env, config, routing, caching, migrations or content): check it after that one push, and push again only if a fix is needed. Then return a verdict to the orchestrator:
   - `ALL CLEAR`: the last review had no findings, the gates are green and every AC still passes.
   - `NOT CLEAR`: otherwise, with each open finding and why it wasn't fixed.

---

## 3. Local environment

There is one local Postgres container, from `compose.yaml` (created in T001). Each ticket gets an isolated database and port, so implementers can run in parallel:

| Item | Value |
|---|---|
| Database | `ludwig_<id>`, e.g. `ludwig_t019`, on the shared container `ludwig-db-1`. Drop it after the ticket merges |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | `postgres://ludwig:ludwig@localhost:5432/ludwig_<id>` in the worktree's `.env.local` |
| Dev server port | `3000 + <numeric id>`, e.g. T019 uses 3019. Run `pnpm dev --port <port>` in the background, and stop it when you're done |
| `BETTER_AUTH_URL` | `http://localhost:<port>` |
| Verification artefacts | `.verification/<id>/` inside the worktree, which is git-ignored: screenshots, cookies, logs |

Setup, in the worktree:

1. `pnpm install`.
2. Create the database: `psql postgres://ludwig:ludwig@localhost:5432/ludwig -c "create database ludwig_<id>"`. Host `createdb`/`dropdb` hang on a password prompt, so always use URLs with the password.
3. Create `.env.local`. It is git-ignored but required: the build validates env, and drizzle-kit and Vitest load it.

   ```bash
   cp /Users/maxitect/Documents/pers-repos/ludwig/.env.local .env.local
   sed -i '' -E 's#^(DATABASE_URL(_UNPOOLED)?=.*/)ludwig$#\1ludwig_<id>#; s#^BETTER_AUTH_URL=.*#BETTER_AUTH_URL=http://localhost:<port>#' .env.local
   grep -c ludwig_<id> .env.local   # must print 2
   ```

4. `pnpm db:migrate && pnpm db:seed`.

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

- **Previews:** every pushed PR branch gets a preview deployment and its own Neon branch. Verify deployed ACs there: `vercel curl` for API checks, a `get_access_to_vercel_url` share link for browser checks. Sign up test users on previews only. Each push costs a preview build and a CI run, so push as few times as possible (sections 2.4 and 2.5).
- **Neon reads:** read-only SQL (`run_sql` with `SELECT`) on any branch, including production `main`, is allowed for verification. Pass `branch_id` for preview branches.
- **Neon writes:** writing SQL is allowed on preview branches. On production `main`, any write, delete or schema change, and every destructive Neon operation (deleting branches, resetting, dropping), needs the user's explicit approval first. Implementers ask the orchestrator, and the orchestrator asks the user. The one standing exception: the orchestrator deletes a merged ticket's preview branch during cleanup (`/orchestrate` skill, merge cleanup).
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
