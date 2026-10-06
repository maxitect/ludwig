import path from "node:path";
import {
  fail,
  mainCheckout,
  openLog,
  pass,
  type Result,
  runSteps,
  sh,
} from "./lib";
import { sweep } from "./sweep";

const root = mainCheckout();
const notes: string[] = [];

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

process.chdir(root);
openLog(path.join(root, ".verification", "preflight.log"));

runSteps(
  "PREFLIGHT",
  [
    { name: "docker postgres healthy", run: () => sh("docker compose up -d --wait") },
    { name: "homebrew postgresql@17 stopped", run: homebrewPostgresStopped },
    { name: "gh auth", run: () => sh("gh auth status") },
    { name: "main clean and synced", run: mainClean },
    {
      name: "sweep merged tickets",
      run: () => {
        notes.push(...sweep());
        return pass;
      },
    },
    { name: "install", run: () => sh("pnpm install --frozen-lockfile") },
    { name: "db:migrate", run: () => sh("pnpm db:migrate") },
    { name: "db:seed", run: () => sh("pnpm db:seed") },
    { name: "typecheck", run: () => sh("pnpm typecheck") },
    { name: "lint", run: () => sh("pnpm lint") },
    { name: "test", run: () => sh("pnpm test") },
    { name: "build", run: () => sh("pnpm build") },
    { name: "puzzles:verify", run: () => sh("pnpm puzzles:verify") },
  ],
  notes,
);
