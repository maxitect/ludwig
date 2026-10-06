import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  adminUrl,
  currentBranch,
  dbName,
  die,
  fail,
  mainCheckout,
  normaliseId,
  openLog,
  pass,
  port,
  type Result,
  runSteps,
  sh,
  text,
  ticketBranch,
  topLevel,
} from "./lib";

const id = normaliseId(process.argv[2]);
const root = topLevel();
const main = mainCheckout();
if (root === main) die("SETUP", "run inside the ticket's worktree, not the main checkout");

const branch = ticketBranch(id, root);
const db = dbName(id);
const devPort = port(id);

function checkoutBranch(): Result {
  const current = currentBranch();
  if (current === branch) return pass;
  if (text(`git branch --list "${branch}"`)) {
    return sh(`git switch "${branch}"`);
  }
  return sh(`git branch -m "${branch}"`);
}

function createDatabase(): Result {
  const exists = text(
    `psql "${adminUrl}" -tAc "select 1 from pg_database where datname = '${db}'"`,
  );
  return exists === "1" ? pass : sh(`psql "${adminUrl}" -c "create database ${db}"`);
}

function writeEnv(): Result {
  const env = readFileSync(path.join(main, ".env.local"), "utf8")
    .replace(/^(DATABASE_URL(?:_UNPOOLED)?=.*\/)ludwig$/gm, `$1${db}`)
    .replace(/^BETTER_AUTH_URL=.*$/m, `BETTER_AUTH_URL=http://localhost:${devPort}`);
  const pointed = env.match(new RegExp(`/${db}$`, "gm"))?.length ?? 0;
  if (pointed !== 2) return fail(`.env.local: expected 2 database URLs for ${db}, got ${pointed}`);
  writeFileSync(path.join(root, ".env.local"), env);
  return pass;
}

openLog(path.join(root, ".verification", id, "setup.log"));

runSteps(
  "SETUP",
  [
    { name: `branch ${branch}`, run: checkoutBranch },
    { name: "install", run: () => sh("pnpm install --frozen-lockfile") },
    { name: `database ${db}`, run: createDatabase },
    { name: ".env.local", run: writeEnv },
    { name: "db:migrate", run: () => sh("pnpm db:migrate") },
    { name: "db:seed", run: () => sh("pnpm db:seed") },
  ],
  [`${id} branch=${branch} db=${db} port=${devPort} artefacts=.verification/${id}/`],
);
