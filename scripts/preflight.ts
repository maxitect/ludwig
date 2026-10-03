import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const logPath = path.join(root, ".verification", "preflight.log");
const adminUrl = "postgres://ludwig:ludwig@localhost:5432/ludwig";

type Result = { ok: boolean; out: string };

function sh(command: string): Result {
  const res = spawnSync(command, {
    shell: true,
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${res.stdout}${res.stderr}`;
  appendFileSync(logPath, `$ ${command}\n${out}\n`);
  return { ok: res.status === 0, out };
}

function fail(message: string): Result {
  return { ok: false, out: message };
}

const pass: Result = { ok: true, out: "" };

const notes: string[] = [];

function docker(): Result {
  return sh("docker compose up -d --wait");
}

function homebrewPostgresStopped(): Result {
  const list = sh("brew services list");
  if (!list.ok) return pass;
  const running = list.out
    .split("\n")
    .some((line) => /^postgresql@17\s+started/.test(line));
  return running
    ? fail("brew postgresql@17 is running: brew services stop postgresql@17")
    : pass;
}

function mainClean(): Result {
  const branch = sh("git rev-parse --abbrev-ref HEAD");
  if (branch.out.trim() !== "main") return fail("not on main");
  if (!sh("git fetch origin main").ok) return fail("git fetch failed");
  if (sh("git status --porcelain").out.trim()) {
    return fail("main has uncommitted changes");
  }
  if (!sh("git merge --ff-only origin/main").ok) {
    return fail("main cannot fast-forward to origin/main");
  }
  const head = sh("git rev-parse HEAD").out.trim();
  const remote = sh("git rev-parse origin/main").out.trim();
  return head === remote ? pass : fail("main is ahead of origin/main");
}

function ticketId(branch: string): string | undefined {
  return /^ticket\/(T\d+)-/.exec(branch)?.[1]?.toLowerCase();
}

function hasMergedPr(branch: string): boolean {
  const res = sh(`gh pr list --head ${branch} --state merged --json number`);
  return res.ok && res.out.trim() !== "[]" && res.out.trim() !== "";
}

function dropDatabases(id: string) {
  for (const name of [`ludwig_${id}`, `ludwig_${id}_test`]) {
    sh(`psql "${adminUrl}" -c 'DROP DATABASE IF EXISTS ${name} WITH (FORCE)'`);
  }
}

function cleanMergedWorktrees(): Result {
  const listing = sh("git worktree list --porcelain").out;
  const prefix = path.join(root, ".claude", "worktrees", "agent-");
  const entries = listing.split("\n\n").map((block) => ({
    path: /^worktree (.+)$/m.exec(block)?.[1] ?? "",
    branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? "",
  }));

  for (const { path: wt, branch } of entries) {
    if (!wt.startsWith(prefix) || !branch.startsWith("ticket/")) continue;
    if (!hasMergedPr(branch)) continue;
    sh(`git worktree remove -f -f "${wt}"`);
    sh(`git branch -D "${branch}"`);
    const id = ticketId(branch);
    if (id) dropDatabases(id);
    notes.push(`removed merged worktree ${branch}`);
  }

  const inUse = new Set(entries.map((e) => e.branch));
  const branches = sh(
    "git for-each-ref --format='%(refname:short)' refs/heads/ticket/",
  )
    .out.split("\n")
    .map((b) => b.replace(/'/g, "").trim())
    .filter(Boolean);
  for (const branch of branches) {
    if (inUse.has(branch)) continue;
    if (sh(`git log main..${branch} --oneline`).out.trim()) continue;
    sh(`git branch -D "${branch}"`);
    notes.push(`deleted empty branch ${branch}`);
  }
  return pass;
}

const steps: { name: string; run: () => Result }[] = [
  { name: "docker postgres healthy", run: docker },
  { name: "homebrew postgresql@17 stopped", run: homebrewPostgresStopped },
  { name: "gh auth", run: () => sh("gh auth status") },
  { name: "main clean and synced", run: mainClean },
  { name: "clean merged worktrees", run: cleanMergedWorktrees },
  { name: "install", run: () => sh("pnpm install --frozen-lockfile") },
  { name: "db:migrate", run: () => sh("pnpm db:migrate") },
  { name: "db:seed", run: () => sh("pnpm db:seed") },
  { name: "typecheck", run: () => sh("pnpm typecheck") },
  { name: "lint", run: () => sh("pnpm lint") },
  { name: "test", run: () => sh("pnpm test") },
  { name: "build", run: () => sh("pnpm build") },
  { name: "puzzles:verify", run: () => sh("pnpm puzzles:verify") },
];

mkdirSync(path.dirname(logPath), { recursive: true });
writeFileSync(logPath, "");
const started = Date.now();

for (const step of steps) {
  const result = step.run();
  if (!result.ok) {
    const tail = result.out.trim().split("\n").slice(-10).join("\n");
    console.log(`PREFLIGHT FAIL: ${step.name} (full log: ${logPath})\n${tail}`);
    process.exit(1);
  }
}

for (const note of notes) console.log(note);
console.log(
  `PREFLIGHT PASS (${steps.length} steps, ${Math.round((Date.now() - started) / 1000)}s)`,
);
