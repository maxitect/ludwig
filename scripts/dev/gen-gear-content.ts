import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  generateDiagram,
  generateFixVariant,
} from "../../src/puzzles/gears/generate";
import { type Difficulty, difficulties } from "../../src/puzzles/gears/presets";
import type { Content } from "../../src/puzzles/gears/schema";

type Entry = {
  slug: string;
  title: string;
  tier: Difficulty;
  seed: string;
  fix?: number;
};

/** One-off: writes content/gears/<slug>.ts for each entry in the JSON file passed as argv[2]. */
const entries: Entry[] = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
const outDir = path.resolve(import.meta.dirname, "../../content/gears");

const line = (value: object) =>
  `{ ${Object.entries(value)
    .map(([key, v]) => `${key}: ${JSON.stringify(v)}`)
    .join(", ")} }`;

function render({ slug, title, tier, seed, fix }: Entry, content: Content) {
  const note = fix
    ? `Generated with the Fix the Diagram generator (seed ${seed}, ${tier} preset, K=${fix}), then curated by the Ludwig authors.`
    : `Generated with the gear generator (seed ${seed}, ${tier} preset), then curated by the Ludwig authors.`;
  const { solution, gears, meshes, ...rest } = {
    ...content,
    generatorSeed: null,
  };
  const scalars = Object.entries(rest)
    .map(([key, v]) => `  ${key}: ${JSON.stringify(v)},`)
    .join("\n");
  return `import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: ${JSON.stringify(slug)},
  title: ${JSON.stringify(title)},
  difficulty: ${difficulties.indexOf(tier) + 2},
  sourceNote: ${JSON.stringify(note)},
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
${scalars}
  gears: [
${gears.map((g) => `    ${line(g)},`).join("\n")}
  ],
  meshes: [
${meshes.map((m) => `    ${line(m)},`).join("\n")}
  ],
  solution: {
    crank: ${solution.crank},
    convergence: ${solution.convergence},
    killerLabel: ${JSON.stringify(solution.killerLabel)},
    swaps: [${solution.swaps.map(line).join(", ")}],
  },
} satisfies Content;
`;
}

mkdirSync(outDir, { recursive: true });
for (const entry of entries) {
  const content = entry.fix
    ? generateFixVariant(entry.seed, entry.tier, entry.fix)
    : generateDiagram(entry.seed, entry.tier);
  writeFileSync(path.join(outDir, `${entry.slug}.ts`), render(entry, content));
  console.log(
    `${entry.slug}: ${entry.tier}${entry.fix ? ` fix${entry.fix}` : ""}, ${content.gears.length} gears, crank ${content.solution.crank}, figure ${content.solution.convergence}, killer ${content.solution.killerLabel}`,
  );
}
