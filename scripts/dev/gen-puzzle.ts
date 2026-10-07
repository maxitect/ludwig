import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { isDifficulty } from "../../src/puzzles/_shared/generate/pipeline";
import { generators, regenerate } from "../../src/puzzles/generators";
import { formatContentFile } from "./format-content";

const usage =
  "usage: pnpm puzzles:gen <type> --seed <text> --difficulty <1-5> [--slug <slug>] [--title <title>] [--version <n>]";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const titleCase = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      seed: { type: "string" },
      difficulty: { type: "string" },
      slug: { type: "string" },
      title: { type: "string" },
      version: { type: "string" },
    },
  });
  const [typeKey] = positionals;
  const difficulty = Number(values.difficulty);
  if (!typeKey || !values.seed || !isDifficulty(difficulty)) {
    throw new Error(usage);
  }
  const versions = Object.hasOwn(generators, typeKey)
    ? Object.keys(generators[typeKey]).map(Number)
    : [];
  if (!versions.length) throw new Error(`Unknown generator: ${typeKey}`);
  const version = values.version
    ? Number(values.version)
    : Math.max(...versions);
  const slug = values.slug ?? slugify(values.seed);
  const file = path.resolve("content", typeKey, `${slug}.ts`);
  if (existsSync(file)) throw new Error(`${file} already exists`);

  const generated = { generator: typeKey, version, seed: values.seed };
  const { content, attempts } = regenerate(generated, difficulty);
  writeFileSync(
    file,
    formatContentFile({
      typeKey,
      slug,
      title: values.title ?? titleCase(slug),
      difficulty,
      publishedAt: new Date().toISOString().slice(0, 10),
      content,
      generated,
    }),
  );
  console.log(
    `wrote ${path.relative(process.cwd(), file)} (${attempts} candidate${attempts === 1 ? "" : "s"})`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
