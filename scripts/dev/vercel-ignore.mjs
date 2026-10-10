import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tooling = [/^docs\//, /\.md$/, /^\.claude\//, /^scripts\/dev\//];

const run = (command) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

function decide(skip, reason) {
  console.log(`${skip ? "Skipping" : "Building"}: ${reason}`);
  process.exit(skip ? 0 : 1);
}

function baseCommit() {
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
  if (previous) {
    try {
      run(`git cat-file -e ${previous}^{commit}`);
      return previous;
    } catch {}
  }
  const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug } =
    process.env;
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  run(
    `git fetch --quiet --depth=300 https://github.com/${owner}/${slug}.git main:refs/ignore/main ${branch}:refs/ignore/branch`,
  );
  return run("git merge-base HEAD refs/ignore/main");
}

function withoutToolingScripts(json) {
  const pkg = JSON.parse(json);
  for (const [key, command] of Object.entries(pkg.scripts ?? {})) {
    if (command.includes("scripts/dev/")) delete pkg.scripts[key];
  }
  return JSON.stringify(pkg);
}

function wantsPreview() {
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
  if (/\[preview\]/i.test(process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "")) return true;
  if (!branch.startsWith("ticket/")) return false;
  try {
    const ticket = readFileSync(`docs/tickets/${branch.slice("ticket/".length)}.md`, "utf8");
    return /^preview:\s*true\s*$/m.test(ticket.split("---")[1] ?? "");
  } catch {
    return false;
  }
}

if (process.env.VERCEL_ENV === "preview" && !wantsPreview()) {
  decide(true, "previews are opt-in: set `preview: true` in the ticket frontmatter or put [preview] in the commit message");
}

try {
  const base = baseCommit();
  if (base === run("git rev-parse HEAD")) {
    decide(false, "no earlier deployed commit to compare against");
  }
  const changed = run(`git diff --name-only ${base} HEAD`)
    .split("\n")
    .filter(Boolean);
  const app = changed.filter((file) => {
    if (tooling.some((pattern) => pattern.test(file))) return false;
    if (file !== "package.json") return true;
    return (
      withoutToolingScripts(run(`git show ${base}:package.json`)) !==
      withoutToolingScripts(run("git show HEAD:package.json"))
    );
  });
  if (app.length) decide(false, `app files changed (${app.slice(0, 5).join(", ")})`);
  decide(true, `only docs and dev tooling changed since ${base.slice(0, 7)}`);
} catch (error) {
  decide(false, `could not compute the diff (${error.message.split("\n")[0]})`);
}
