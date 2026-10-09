import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["src/puzzles", "src/components"];

const RAW_TOKENS = [
  { name: "border-ink", pattern: /(?<![\w-])border-ink(?![\w-])/ },
  { name: "bg-paper", pattern: /(?<![\w-])bg-paper(?![\w-])/ },
  { name: "text-ink", pattern: /(?<![\w-])text-ink(?![\w-])/ },
  { name: "var(--color-shadow)", pattern: /var\(--color-shadow\)/ },
] as const;

type RawToken = (typeof RAW_TOKENS)[number]["name"];

/** Intentional uses of raw tokens, by file. A grid, and a chess glyph's tile, stays paper in Ink by decision. */
const ALLOWED: Record<string, readonly RawToken[]> = {
  "src/components/ui/card.tsx": ["bg-paper", "text-ink"],
  "src/puzzles/_shared/cell-grid/cell-grid.tsx": ["bg-paper", "text-ink"],
  "src/puzzles/_shared/highlight-path/highlight-path-grid.tsx": [
    "bg-paper",
    "text-ink",
  ],
  "src/puzzles/_shared/digit-grid.tsx": ["text-ink"],
  "src/puzzles/_shared/chess-board/pieces.tsx": ["var(--color-shadow)"],
  "src/puzzles/_shared/chess-board/uncapture-tray.tsx": ["bg-paper"],
  "src/puzzles/_shared/cipher-key/cipher-key-panel.tsx": [
    "border-ink",
    "bg-paper",
    "text-ink",
  ],
  "src/puzzles/_shared/letter-tiles/letter-tile.tsx": ["bg-paper", "text-ink"],
  "src/puzzles/acrostic/solver.tsx": ["bg-paper"],
  "src/puzzles/anagram/solver.tsx": ["bg-paper"],
  "src/puzzles/book-cipher/solver.tsx": ["border-ink", "bg-paper", "text-ink"],
  "src/puzzles/logic-grid/mark-grid.tsx": [
    "bg-paper",
    "text-ink",
    "border-ink",
  ],
  "src/puzzles/sudoku/solver.tsx": ["border-ink"],
  "src/puzzles/rota/board.tsx": ["border-ink", "bg-paper", "text-ink"],
  "src/puzzles/reverse-chess/side-to-move.tsx": ["bg-paper"],
  "src/puzzles/spot-difference/solver.tsx": ["bg-paper"],
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__snapshots__" ? [] : sourceFiles(path);
    }
    return /\.(tsx?|css)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [path]
      : [];
  });
}

describe("no-raw-tokens", () => {
  it("keeps raw ink, paper and shadow tokens out of puzzles and components", () => {
    const violations = ROOTS.flatMap(sourceFiles).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const allowed: readonly RawToken[] = ALLOWED[file] ?? [];
      return RAW_TOKENS.filter(
        ({ name, pattern }) => !allowed.includes(name) && pattern.test(source),
      ).map(
        ({ name }) =>
          `no-raw-tokens: ${file} uses ${name}; use bg-card, border-border, text-card-foreground or the --cast shadow, or allowlist it in src/config/raw-tokens.test.ts`,
      );
    });
    expect(violations).toEqual([]);
  });

  it("allowlists only files that still use the token", () => {
    const stale = Object.entries(ALLOWED).flatMap(([file, names]) => {
      const source = readFileSync(file, "utf8");
      return RAW_TOKENS.filter(
        ({ name, pattern }) => names.includes(name) && !pattern.test(source),
      ).map(({ name }) => `${file}: ${name}`);
    });
    expect(stale).toEqual([]);
  });
});
