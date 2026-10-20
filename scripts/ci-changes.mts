import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";

/**
 * Decides which CI suites a change needs, from the files changed since `base`. `full` (a push to
 * main) or a change to CI or dependencies runs every suite in full. Prints `key=value` lines and
 * appends them to $GITHUB_OUTPUT when it is set.
 */

const [base, mode] = process.argv.slice(2);
if (!base) throw new Error("usage: node scripts/ci-changes.mts <base-ref> [full]");

const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const ignored = [/^docs\//, /\.md$/, /^\.claude\//, /^scripts\/dev\//];
const everything = [
  /^\.github\/workflows\/ci\.yml$/,
  /^scripts\/ci-changes\.mts$/,
  /^package\.json$/,
  /^pnpm-(lock|workspace)\.yaml$/,
];
const vitestPaths = [/^(src|scripts|content|drizzle)\//, /^vitest\.config\.ts$/];
const dbPaths = [/^drizzle\//, /^src\/db\//];
const verifyPaths = [
  /^(src\/puzzles|content|drizzle)\//,
  /^scripts\/(verify-puzzles|content-files|seed)/,
];
const e2ePaths = [
  /^(src|content|drizzle|public|e2e)\//,
  /^scripts\/(seed|content-files)/,
  /^(next|playwright)\.config\.ts$/,
  /^postcss\.config\.mjs$/,
  /^tsconfig\.json$/,
];
/** Files every new puzzle type adds an entry to, which say nothing about which pages changed. */
const registration = [
  /^src\/puzzles\/(registry|solvers|previews|sample-payloads|attempt-schemas|generators)\.tsx?$/,
  /^src\/puzzles\/__snapshots__\//,
  /^src\/db\/(schema\/index|relations)\.ts$/,
  /^content\/lookups\.ts$/,
  /^drizzle\//,
];

const relevant = files.filter((file) => !ignored.some((p) => p.test(file)));
const matching = (paths: RegExp[]) =>
  relevant.filter((file) => paths.some((p) => p.test(file)));
const full = mode === "full" || matching(everything).length > 0;
const appFiles = matching(e2ePaths).filter((file) => !/\.test\.tsx?$/.test(file));

const types = readdirSync("src/puzzles", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name);
const specs = readdirSync("e2e").filter((name) => name.endsWith(".spec.ts"));
const camel = (type: string) => type.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** The puzzle types a spec exercises: its file name prefix, or every type its source names. */
function typesOf(spec: string) {
  const prefix = types
    .filter((type) => spec.startsWith(`${type}.`) || spec.startsWith(`${type}-`))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix) return [prefix];
  const text = readFileSync(`e2e/${spec}`, "utf8");
  return types.filter((type) =>
    new RegExp(`(?<![a-zA-Z-])(${type}|${camel(type)})(?![a-z-])`).test(text),
  );
}

function selectSpecs() {
  const changes = appFiles.filter((file) => !registration.some((p) => p.test(file)));
  const affected = new Set<string>();
  const picked = new Set<string>();
  const shared: string[] = [];
  for (const file of changes) {
    const type = /^(?:src\/puzzles|content)\/([^/]+)\//.exec(file)?.[1];
    const spec = /^e2e\/([^/]+\.spec\.ts)$/.exec(file)?.[1];
    const helper = /^e2e\/(helpers\/[^/]+)\.ts$/.exec(file)?.[1];
    if (type && types.includes(type)) affected.add(type);
    else if (spec) picked.add(spec);
    else if (helper) {
      for (const s of specs) if (readFileSync(`e2e/${s}`, "utf8").includes(`./${helper}"`)) picked.add(s);
    } else shared.push(file);
  }
  if (full || shared.length) {
    console.log(`e2e runs every spec: ${full ? "full run" : shared.slice(0, 5).join(", ")}`);
    return [];
  }
  return specs.filter((spec) => {
    const exercised = typesOf(spec);
    return picked.has(spec) || exercised.length === 0 || exercised.some((t) => affected.has(t));
  });
}

const e2e = full || appFiles.length > 0;
const selected = e2e ? selectSpecs() : [];
const shards = selected.length ? Math.min(3, Math.ceil(selected.length / 10)) : 3;
const perf = selected.length === 0 || selected.includes("landing-walls.spec.ts");
const matrix = [
  ...Array.from({ length: shards }, (_, index) => `${index + 1}/${shards}`),
  ...(perf ? ["perf"] : []),
];

const outputs = {
  validate: full || relevant.length > 0,
  vitest: full || matching(vitestPaths).length > 0,
  vitest_full: full,
  db_full: full || matching(dbPaths).length > 0,
  verify: full || matching(verifyPaths).length > 0,
  e2e,
  e2e_specs: selected.map((spec) => `e2e/${spec}`).join(" "),
  e2e_matrix: JSON.stringify(matrix),
};

const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
console.log(`changed files: ${files.length}, outside docs and tooling: ${relevant.length}`);
console.log(lines.join("\n"));
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
