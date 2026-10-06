import { readFileSync } from "node:fs";
import path from "node:path";
import {
  codeUnchangedSince,
  currentBranch,
  idFromBranch,
  readIfExists,
  reportPath,
  sh,
  text,
  topLevel,
} from "./lib";

type HookInput = { cwd?: string; stop_hook_active?: boolean };

const input: HookInput = JSON.parse(readFileSync(0, "utf8") || "{}");
const cwd = input.cwd ?? process.cwd();

function block(reason: string): never {
  console.error(`Not finished: ${reason}`);
  process.exit(2);
}

const branch = currentBranch(cwd);
const id = idFromBranch(branch);
if (input.stop_hook_active || !id) process.exit(0);

const root = topLevel(cwd);
const report = readIfExists(reportPath(id, root));
if (!report) block(`write docs/tickets/reports/${id}.md (INSTRUCTIONS §4) and commit it.`);
if (/^Status:\s*BLOCKED/m.test(report)) process.exit(0);

const untrackedReport = !sh(
  `git ls-files --error-unmatch "docs/tickets/reports/${id}.md"`,
  cwd,
).ok;
if (untrackedReport || text("git status --porcelain --untracked-files=no", cwd)) {
  block("commit your changes, including the report.");
}

const recorded = readIfExists(path.join(root, ".verification", id, "gates.ok"))?.trim();
if (!recorded || !codeUnchangedSince(recorded, cwd)) {
  block("code changed since the last green `pnpm ticket:gates`. Run it again.");
}

const prs = sh(`gh pr list --head "${branch}" --state open --json number`, cwd);
if (!prs.ok || prs.out.trim() === "[]") {
  block("open the PR with /pr-prep (INSTRUCTIONS §2.4).");
}

const body = text(`gh pr view "${branch}" --json body --jq .body`, cwd);
if (/Generated with \[?Claude|Co-Authored-By: Claude/i.test(body)) {
  block("remove the AI attribution from the PR description (`gh pr edit --body-file`); /pr-prep bans it.");
}

if (text(`git log @{u}..HEAD --oneline -- . ':(exclude)docs' ':(exclude)*.md'`, cwd)) {
  block("code commits are not pushed.");
}
