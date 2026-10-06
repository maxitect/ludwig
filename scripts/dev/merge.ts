import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  currentBranch,
  die,
  fail,
  mainCheckout,
  normaliseId,
  openLog,
  pass,
  prChecks,
  prsForTicket,
  type Result,
  runSteps,
  sh,
  text,
} from "./lib";
import { sweep } from "./sweep";

const id = normaliseId(process.argv[2]);
const root = mainCheckout();
process.chdir(root);
if (currentBranch() !== "main") die("MERGE", "the main checkout is not on main");

const pr = prsForTicket(id).find((p) => p.state === "OPEN");
if (!pr) die("MERGE", `no open PR for ${id}`);
const branch = pr.headRefName;
const remote = `origin/${branch}`;
const notes: string[] = [];

const migrationPaths = ["drizzle/"];
const seedPaths = ["drizzle/", "content/"];
const previewPaths = ["drizzle/", "content/", "e2e/"];
const prodPaths = [
  "drizzle/",
  "content/",
  "src/lib/auth",
  "src/proxy.ts",
  "src/env",
  "next.config.ts",
  "vercel.json",
  "package.json",
  ".github/",
];

let prFiles: string[] = [];
const touches = (prefixes: string[], files = prFiles) =>
  files.filter((f) => prefixes.some((p) => f.startsWith(p)));

function changedFiles(from: string, to: string): string[] {
  return text(`git diff --name-only ${from} ${to}`).split("\n").filter(Boolean);
}

function reviewVerdict(): Result {
  const local = text(`git branch --list "${branch}"`) ? branch : remote;
  const report = sh(`git show "${local}:docs/tickets/reports/${id}.md"`);
  if (!report.ok) return fail(`no report for ${id} on ${local}`);
  return /^Verdict:\s*ALL CLEAR/m.test(report.out)
    ? pass
    : fail("report has no `Verdict: ALL CLEAR`: the reviewer has not cleared it");
}

function unpushedDocsOnly(): Result {
  if (!text(`git branch --list "${branch}"`)) return pass;
  const unpushed = changedFiles(remote, branch);
  const code = unpushed.filter((f) => !f.startsWith("docs/") && !f.endsWith(".md"));
  if (code.length) return fail(`unpushed code on ${branch}: ${code.join(", ")}`);
  return pass;
}

function upToDate(): Result {
  const base = text(`git merge-base origin/main ${remote}`);
  prFiles = changedFiles(base, remote);
  const mainFiles = changedFiles(base, "origin/main");
  if (touches(migrationPaths, mainFiles).length && touches(migrationPaths).length) {
    return fail("main gained a migration since this branch: rebase, run gates, push");
  }
  const overlap = prFiles.filter((f) => mainFiles.includes(f));
  if (overlap.length) {
    return fail(`main changed files this PR touches: ${overlap.join(", ")}. Rebase, run gates, push`);
  }
  return pass;
}

function mergeable(): Result {
  for (let attempt = 0; attempt < 5; attempt++) {
    const state = text(`gh pr view ${pr!.number} --json mergeable --jq .mergeable`);
    if (state === "MERGEABLE") return pass;
    if (state === "CONFLICTING") return fail("PR conflicts with main: rebase needed");
    spawnSync("sleep", ["5"]);
  }
  return fail("GitHub has not computed mergeability; retry shortly");
}

function checksGreen(): Result {
  const wait = touches(previewPaths).length > 0;
  const deadline = Date.now() + 20 * 60 * 1000;
  for (;;) {
    const checks = prChecks(pr!.number);
    const failed = checks.filter((c) => c.bucket === "fail");
    if (failed.length) return fail(`failed checks: ${failed.map((c) => c.name).join(", ")}`);
    const pending = checks.some((c) => c.bucket === "pending") || (wait && !checks.length);
    if (!pending) return pass;
    if (!wait) {
      notes.push("merged with checks still running (no migration, content or e2e changes)");
      return pass;
    }
    if (Date.now() > deadline) return fail("checks still pending after 20 minutes; rerun later");
    spawnSync("sleep", ["30"]);
  }
}

function squashMerge(): Result {
  const subject = `${pr!.title} (#${pr!.number})`;
  const res = spawnSync(
    "gh",
    ["pr", "merge", String(pr!.number), "--squash", "--subject", subject, "--body", ""],
    { encoding: "utf8" },
  );
  if (res.status !== 0) return fail(`${res.stdout}${res.stderr}`);
  sh(`git push origin --delete "${branch}"`);
  return pass;
}

function syncMain(): Result {
  const pull = sh("git pull --ff-only origin main");
  if (!pull.ok) return pull;
  const install = sh("pnpm install --frozen-lockfile");
  if (!install.ok || !touches(seedPaths).length) return install;
  notes.push("migrated and seeded local database");
  return sh("pnpm db:migrate && pnpm db:seed");
}

function carryUnpushedDocs(): Result {
  if (!text(`git branch --list "${branch}"`)) return pass;
  const docs = changedFiles(remote, branch);
  if (!docs.length) return pass;
  const res = sh(`git checkout "${branch}" -- ${docs.map((f) => `"${f}"`).join(" ")}`);
  if (res.ok) notes.push(`staged unpushed reviewer docs on main: ${docs.join(", ")}`);
  return res;
}

function overlappingPrs() {
  const open: { number: number; headRefName: string }[] = JSON.parse(
    text(`gh pr list --state open --json number,headRefName`) || "[]",
  );
  const hadMigration = touches(migrationPaths).length > 0;
  for (const other of open) {
    const files = text(`gh pr view ${other.number} --json files --jq '.files[].path'`)
      .split("\n")
      .filter(Boolean);
    const shared = files.filter((f) => prFiles.includes(f));
    const migration = hadMigration && touches(migrationPaths, files).length > 0;
    if (shared.length || migration) {
      const why = migration ? "main gained a migration" : `shares ${shared.join(", ")}`;
      notes.push(`notify ${other.headRefName} (#${other.number}): ${why}; rebase before its push`);
    }
  }
}

openLog(path.join(root, ".verification", id, "merge.log"));
sh("git fetch origin --prune");

runSteps(
  "MERGE",
  [
    { name: "review verdict", run: reviewVerdict },
    { name: "no unpushed code", run: unpushedDocsOnly },
    { name: "up to date with main", run: upToDate },
    { name: "mergeable", run: mergeable },
    { name: "checks", run: checksGreen },
    { name: `squash-merge #${pr.number}`, run: squashMerge },
    { name: "sync main", run: syncMain },
    { name: "carry unpushed docs", run: carryUnpushedDocs },
    {
      name: "cleanup",
      run: () => {
        notes.push(...sweep());
        overlappingPrs();
        const prod = touches(prodPaths);
        if (prod.length) {
          notes.push(`check production build and runtime logs (touches ${prod.slice(0, 5).join(", ")})`);
        }
        return pass;
      },
    },
  ],
  notes,
);
