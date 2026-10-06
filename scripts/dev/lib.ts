import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export type Result = { ok: boolean; out: string };
export type Step = { name: string; run: () => Result };

export const adminUrl = "postgres://ludwig:ludwig@localhost:5432/ludwig";
export const neonProject = "bold-term-80947033";

export const pass: Result = { ok: true, out: "" };

export function fail(message: string): Result {
  return { ok: false, out: message };
}

let logPath: string | undefined;

export function openLog(file: string) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "");
  logPath = file;
}

export function sh(command: string, cwd = process.cwd()): Result {
  const res = spawnSync(command, {
    shell: true,
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  if (logPath) appendFileSync(logPath, `$ ${command}\n${out}\n`);
  return { ok: res.status === 0, out };
}

export function text(command: string, cwd?: string): string {
  return sh(command, cwd).out.trim();
}

/** Runs steps in order. Prints one PASS line, or the failing step's tail and exits 1. */
export function runSteps(label: string, steps: Step[], notes: string[] = []) {
  const started = Date.now();
  for (const step of steps) {
    const result = step.run();
    if (!result.ok) {
      const tail = result.out.trim().split("\n").slice(-15).join("\n");
      console.log(`${label} FAIL: ${step.name} (full log: ${logPath})\n${tail}`);
      process.exit(1);
    }
  }
  for (const note of notes) console.log(note);
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(`${label} PASS (${steps.length} steps, ${seconds}s)`);
}

export function die(label: string, message: string): never {
  console.log(`${label} FAIL: ${message}`);
  process.exit(1);
}

export function mainCheckout(cwd = process.cwd()): string {
  return path.dirname(
    path.resolve(cwd, text("git rev-parse --git-common-dir", cwd)),
  );
}

export function topLevel(cwd = process.cwd()): string {
  return text("git rev-parse --show-toplevel", cwd);
}

export function currentBranch(cwd = process.cwd()): string {
  return text("git rev-parse --abbrev-ref HEAD", cwd);
}

/** Git tree id of the working tree as it stands (tracked and untracked files), without touching the index. */
export function workingTree(cwd = process.cwd()): string {
  const index = path.join(
    path.resolve(cwd, text("git rev-parse --git-dir", cwd)),
    "gates-index",
  );
  const env = `GIT_INDEX_FILE="${index}"`;
  sh(`${env} git read-tree HEAD && ${env} git add -A`, cwd);
  return text(`${env} git write-tree`, cwd);
}

/** True when nothing outside docs and markdown differs between a recorded tree and HEAD. */
export function codeUnchangedSince(tree: string, cwd = process.cwd()): boolean {
  return sh(
    `git diff --quiet ${tree} HEAD -- . ':(exclude)docs' ':(exclude)*.md'`,
    cwd,
  ).ok;
}

export function normaliseId(raw: string | undefined): string {
  const match = /^t?(\d{3})$/i.exec(raw ?? "");
  if (!match) die("TICKET", `expected a ticket id like T042, got "${raw}"`);
  return `T${match[1]}`;
}

export function idFromBranch(branch: string): string | undefined {
  return /^ticket\/(T\d{3})-/.exec(branch)?.[1];
}

export function ticketFile(id: string, root = mainCheckout()): string {
  const dir = path.join(root, "docs", "tickets");
  const file = readdirSync(dir).find((f) => f.startsWith(`${id}-`));
  if (!file) die("TICKET", `no ticket file for ${id} in docs/tickets`);
  return path.join(dir, file);
}

export function ticketBranch(id: string, root = mainCheckout()): string {
  return `ticket/${path.basename(ticketFile(id, root), ".md")}`;
}

export function dbName(id: string): string {
  return `ludwig_${id.toLowerCase()}`;
}

export function port(id: string): number {
  return 3000 + Number(id.slice(1));
}

export function reportPath(id: string, root: string): string {
  return path.join(root, "docs", "tickets", "reports", `${id}.md`);
}

export function readIfExists(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

export type Worktree = { path: string; branch: string };

export function worktrees(cwd = process.cwd()): Worktree[] {
  return text("git worktree list --porcelain", cwd)
    .split("\n\n")
    .map((block) => ({
      path: /^worktree (.+)$/m.exec(block)?.[1] ?? "",
      branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? "",
    }));
}

export type Pr = {
  number: number;
  state: "OPEN" | "MERGED" | "CLOSED";
  headRefName: string;
  title: string;
};

export function prsForTicket(id: string, cwd?: string): Pr[] {
  const res = sh(
    `gh pr list --state all --search "head:ticket/${id}-" --json number,state,headRefName,title`,
    cwd,
  );
  if (!res.ok) return [];
  const prs: Pr[] = JSON.parse(res.out);
  return prs.filter((pr) => pr.headRefName.startsWith(`ticket/${id}-`));
}

export type Check = { name: string; bucket: string };

export function prChecks(pr: number, cwd?: string): Check[] {
  const res = sh(`gh pr checks ${pr} --json name,bucket`, cwd);
  try {
    return JSON.parse(res.out);
  } catch {
    return [];
  }
}

export function dropDatabases(id: string) {
  for (const name of [dbName(id), `${dbName(id)}_test`]) {
    sh(`psql "${adminUrl}" -c 'DROP DATABASE IF EXISTS ${name} WITH (FORCE)'`);
  }
}

export function killPort(id: string) {
  sh(`lsof -tiTCP:${port(id)} -sTCP:LISTEN | xargs kill`);
}
