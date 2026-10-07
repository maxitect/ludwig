import { mkdirSync, writeFileSync } from "node:fs";
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
  fix?: number;
};

/** The curated diagrams. Each slug is also its generator seed, so re-running this rewrites the same files. */
const entries: Entry[] = [
  { slug: "first-rehearsal", title: "First Rehearsal", tier: "easy" },
  { slug: "opening-titles", title: "Opening Titles", tier: "easy" },
  { slug: "pas-de-deux", title: "Pas de Deux", tier: "easy", fix: 1 },
  { slug: "second-movement", title: "Second Movement", tier: "medium" },
  { slug: "night-rehearsal", title: "Night Rehearsal", tier: "medium" },
  { slug: "crossed-wires", title: "Crossed Wires", tier: "medium", fix: 1 },
  { slug: "cold-open", title: "Cold Open", tier: "hard" },
  { slug: "red-herring", title: "Red Herring", tier: "hard" },
  { slug: "last-waltz", title: "Last Waltz", tier: "hard", fix: 2 },
  { slug: "final-curtain", title: "Final Curtain", tier: "expert" },
  { slug: "grand-finale", title: "Grand Finale", tier: "expert" },
  { slug: "the-long-take", title: "The Long Take", tier: "expert" },
];
const outDir = path.resolve(import.meta.dirname, "../../content/gears");

const line = (value: object) =>
  `{ ${Object.entries(value)
    .map(([key, v]) => `${key}: ${JSON.stringify(v)}`)
    .join(", ")} }`;

function render({ slug, title, tier, fix }: Entry, content: Content) {
  const note = fix
    ? `Generated with the Fix the Diagram generator (seed ${slug}, ${tier} preset, K=${fix}), chosen by the Ludwig authors and published unedited.`
    : `Generated with the gear generator (seed ${slug}, ${tier} preset), chosen by the Ludwig authors and published unedited.`;
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
    ? generateFixVariant(entry.slug, entry.tier, entry.fix)
    : generateDiagram(entry.slug, entry.tier);
  writeFileSync(path.join(outDir, `${entry.slug}.ts`), render(entry, content));
  console.log(
    `${entry.slug}: ${entry.tier}${entry.fix ? ` fix${entry.fix}` : ""}, ${content.gears.length} gears, crank ${content.solution.crank}, figure ${content.solution.convergence}, killer ${content.solution.killerLabel}`,
  );
}
