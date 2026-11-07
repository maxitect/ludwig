import { spawn } from "node:child_process";
import { openSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  currentBranch,
  fail,
  idFromBranch,
  openLog,
  pass,
  port,
  type Result,
  runSteps,
  sh,
  text,
  topLevel,
  workingTree,
} from "./lib";

const root = topLevel();
const id = idFromBranch(currentBranch()) ?? "local";
const dir = path.join(root, ".verification", id);
const devPort = id === "local" ? 3099 : port(id);
const projects = ["desktop", "mobile", "iphone"];

openLog(path.join(dir, "gates.log"));
rmSync(path.join(dir, "gates.ok"), { force: true });

let e2eStamp = "e2e: skipped (no app files changed)";

function waitForServer(url: string, seconds: number): boolean {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (sh(`curl -s -o /dev/null --max-time 5 ${url}`).ok) return true;
    sh("sleep 1");
  }
  return false;
}

/** Runs the specs CI would run for this branch, on every project, against `pnpm start` on the ticket's port. */
function e2e(): Result {
  if (sh("git status --porcelain -- . ':(exclude)docs' ':(exclude)*.md'").out.trim()) {
    return fail(
      "uncommitted code changes: commit them first, because the e2e selection reads the branch's commits",
    );
  }
  const base = text("git merge-base origin/main HEAD");
  const selection = sh(`node scripts/ci-changes.mts ${base}`);
  if (!selection.ok) return selection;
  const value = (key: string) =>
    new RegExp(`^${key}=(.*)$`, "m").exec(selection.out)?.[1]?.trim() ?? "";
  if (value("e2e") !== "true") {
    e2eStamp = "e2e: skipped (no app files changed)";
    return pass;
  }
  const specs = value("e2e_specs").split(" ").filter(Boolean);
  if (!specs.length) {
    const reason = /^e2e runs every spec: (.*)$/m.exec(selection.out)?.[1] ?? "";
    console.log(`e2e skipped: CI runs every spec for this change (${reason}).`);
    e2eStamp = "e2e: skipped (CI runs every spec)";
    return pass;
  }
  console.log(`e2e: ${specs.length} spec(s) on ${projects.join(", ")}: ${specs.join(" ")}`);

  if (sh(`lsof -tiTCP:${devPort} -sTCP:LISTEN`).out.trim()) {
    return fail(`port ${devPort} is already in use: stop that server first`);
  }
  const serverLog = path.join(dir, "e2e-server.log");
  const log = openSync(serverLog, "w");
  const server = spawn("pnpm", ["start", "--port", String(devPort)], {
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, VERCEL_ENV: "preview" },
  });
  const stop = () => {
    try {
      process.kill(-server.pid!, "SIGTERM");
    } catch {
      // already stopped
    }
    sh(`lsof -tiTCP:${devPort} -sTCP:LISTEN | xargs kill`);
  };
  process.on("exit", stop);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => process.exit(1));
  try {
    const seeded = sh("pnpm db:seed");
    if (!seeded.ok) return seeded;
    const url = `http://localhost:${devPort}`;
    if (!waitForServer(url, 90)) return fail(`the app did not start on ${url} (see ${serverLog})`);
    const run = sh(
      `PLAYWRIGHT_BASE_URL=${url} VERCEL_ENV=preview VERCEL_AUTOMATION_BYPASS_SECRET= pnpm exec playwright test ${specs.join(" ")} ${projects.map((p) => `--project=${p}`).join(" ")} --reporter=line --output=${path.join(dir, "test-results")} --pass-with-no-tests`,
    );
    if (!run.ok) return run;
    e2eStamp = `e2e: ${specs.join(" ")} on ${projects.join(", ")}`;
    return pass;
  } finally {
    stop();
  }
}

runSteps("GATES", [
  { name: "typecheck", run: () => sh("pnpm typecheck") },
  { name: "lint", run: () => sh("pnpm lint") },
  { name: "test", run: () => sh("pnpm test --changed origin/main --passWithNoTests") },
  { name: "build", run: () => sh("pnpm build") },
  { name: "puzzles:verify", run: () => sh("pnpm puzzles:verify") },
  { name: "e2e", run: e2e },
  {
    name: "record",
    run: () => {
      writeFileSync(path.join(dir, "gates.ok"), `${workingTree()}\n${e2eStamp}\n`);
      return pass;
    },
  },
]);
