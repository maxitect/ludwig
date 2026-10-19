import type { Difficulty } from "../src/puzzles/_shared/generate/pipeline";
import type { Provenance } from "../src/puzzles/generators";

const WIDTH = 120;

function literal(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, entry]) => `${key}: ${literal(entry)}`,
    );
    return `{ ${entries.join(", ")} }`;
  }
  return String(value);
}

/** An array of flat objects packed onto lines, like the hand-formatted content files. */
function packed(items: ReadonlyArray<unknown>, indent: string) {
  const lines: string[] = [];
  let line = indent;
  for (const item of items) {
    const piece = `${literal(item)},`;
    if (line.length > indent.length && line.length + 1 + piece.length > WIDTH) {
      lines.push(line);
      line = indent;
    }
    line += line.length > indent.length ? ` ${piece}` : piece;
  }
  if (line.length > indent.length) lines.push(line);
  return lines;
}

const isNested = (value: unknown): value is object =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).some((entry) => Array.isArray(entry));

/** One `key: value,` entry: arrays packed, objects holding arrays expanded one level, the rest on one line. */
function entry(key: string, value: unknown, indent: string): string[] {
  if (Array.isArray(value) && value.length) {
    return [`${indent}${key}: [`, ...packed(value, `${indent}  `), `${indent}],`];
  }
  if (Array.isArray(value)) return [`${indent}${key}: [],`];
  if (isNested(value)) {
    return [
      `${indent}${key}: {`,
      ...Object.entries(value).flatMap(([name, inner]) =>
        entry(name, inner, `${indent}  `),
      ),
      `${indent}},`,
    ];
  }
  return [`${indent}${key}: ${literal(value)},`];
}

/** `export const content = {...}` with flat objects on one line, never expanded JSON. */
export function formatContent(content: object) {
  return [
    "export const content = {",
    ...Object.entries(content).flatMap(([key, value]) =>
      entry(key, value, "  "),
    ),
    "};",
  ].join("\n");
}

export type GeneratedFile = {
  typeKey: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  publishedAt: string;
  content: object;
  generated: Provenance;
};

export function formatContentFile(file: GeneratedFile) {
  return `import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/${file.typeKey}/schema";

export const meta = {
  slug: ${JSON.stringify(file.slug)},
  title: ${JSON.stringify(file.title)},
  difficulty: ${file.difficulty},
  publishedAt: new Date(${JSON.stringify(`${file.publishedAt}T00:00:00Z`)}),
} satisfies ContentMeta;

${formatContent(file.content).replace(/\n};$/, "\n} satisfies Content;")}

export const generated = ${literal(file.generated)} satisfies Provenance;
`;
}
