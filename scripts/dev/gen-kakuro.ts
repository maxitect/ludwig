import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashSeed, mulberry32 } from "../../src/puzzles/_shared/prng";
import { deriveClues } from "../../src/puzzles/kakuro/derive";
import { countSolutions } from "../../src/puzzles/kakuro/engine";
import { verifyKakuro } from "../../src/puzzles/kakuro/verify";

/**
 * One-off authoring tool for the curated kakuro files: builds a seeded layout, fills it with
 * extreme-leaning digits and keeps the first fill whose clues have exactly one solution.
 * Usage: tsx scripts/dev/gen-kakuro.ts <slug> "<Title>" <rows> <cols> <difficulty> <seed> [density]
 */

const [slug, title, rowsArg, colsArg, difficultyArg, seed, densityArg] =
  process.argv.slice(2);
const rows = Number(rowsArg);
const cols = Number(colsArg);
const density = Number(densityArg ?? 0.22);
const rand = mulberry32(hashSeed(seed));
const MAX_RUN = Number(process.env.MAX_RUN ?? 5);
const MIN_FRACTION = Number(process.env.MIN_FRACTION ?? 0.62);

type Grid = boolean[][];

function segments(grid: Grid, across: boolean) {
  const found: [number, number][][] = [];
  const lines = across ? rows : cols;
  const length = across ? cols : rows;
  for (let line = 0; line < lines; line++) {
    let run: [number, number][] = [];
    for (let i = 0; i <= length; i++) {
      const r = across ? line : i;
      const c = across ? i : line;
      if (i < length && grid[r][c]) run.push([r, c]);
      else {
        if (run.length) found.push(run);
        run = [];
      }
    }
  }
  return found;
}

function layout(): Grid {
  for (;;) {
    const grid: Grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => r > 0 && c > 0 && rand() > density),
    );
    for (let changed = true; changed; ) {
      changed = false;
      for (const across of [true, false]) {
        for (const run of segments(grid, across)) {
          if (run.length === 1) {
            grid[run[0][0]][run[0][1]] = false;
            changed = true;
          } else if (run.length > MAX_RUN) {
            const [r, c] = run[MAX_RUN];
            grid[r][c] = false;
            changed = true;
          }
        }
      }
    }
    const whites = grid.flat().filter(Boolean).length;
    if (whites >= (rows - 1) * (cols - 1) * MIN_FRACTION) return grid;
  }
}

function fill(grid: Grid) {
  const digits = new Map<string, number>();
  const cells = grid.flatMap((line, r) =>
    line.flatMap((white, c) => (white ? [[r, c] as const] : [])),
  );
  const taken = (r: number, c: number, dr: number, dc: number) => {
    const used = new Set<number>();
    for (let i = 1; ; i++) {
      const d = digits.get(`${r - dr * i},${c - dc * i}`);
      if (d === undefined) break;
      used.add(d);
    }
    return used;
  };
  const weight = [0, 4, 2, 1, 1, 1, 1, 1, 2, 4];
  const place = (index: number): boolean => {
    if (index === cells.length) return true;
    const [r, c] = cells[index];
    const blocked = new Set([...taken(r, c, 0, 1), ...taken(r, c, 1, 0)]);
    const options = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !blocked.has(d));
    while (options.length) {
      const total = options.reduce((sum, d) => sum + weight[d], 0);
      let pick = rand() * total;
      const at = options.findIndex((d) => (pick -= weight[d]) < 0);
      const [digit] = options.splice(at, 1);
      digits.set(`${r},${c}`, digit);
      if (place(index + 1)) return true;
      digits.delete(`${r},${c}`);
    }
    return false;
  };
  return place(0)
    ? cells.map(([row, col]) => ({ row, col, digit: digits.get(`${row},${col}`)! }))
    : null;
}

type Filled = NonNullable<ReturnType<typeof fill>>;

const countOf = (cells: Filled, limit: number) =>
  countSolutions({ cells, clues: deriveClues(cells) }, limit);

/** Local search: change one digit at a time, keeping every run distinct, whenever the solution count does not grow. */
function refine(start: Filled, board: Grid) {
  const runs = [...segments(board, true), ...segments(board, false)];
  const runsOf = (r: number, c: number) =>
    runs.filter((run) => run.some(([rr, cc]) => rr === r && cc === c));
  let cells = start;
  let count = countOf(cells, 40);
  for (let step = 0; step < 1500 && count > 1; step++) {
    const index = Math.floor(rand() * cells.length);
    const digit = 1 + Math.floor(rand() * 9);
    const target = cells[index];
    const clash = runsOf(target.row, target.col).some((run) =>
      run.some(([r, c]) =>
        cells.some(
          (cell) =>
            cell !== target && cell.row === r && cell.col === c && cell.digit === digit,
        ),
      ),
    );
    if (clash) continue;
    const next = cells.map((cell, i) => (i === index ? { ...cell, digit } : cell));
    const nextCount = countOf(next, 40);
    if (nextCount <= count) {
      cells = next;
      count = nextCount;
    }
  }
  return count === 1 ? cells : null;
}

for (let attempt = 1; ; attempt++) {
  const board = layout();
  for (let tries = 0; tries < 6; tries++) {
    const first = fill(board);
    if (!first) continue;
    const cells = refine(first, board);
    if (!cells) continue;
    const content = { rows, cols, cells };
    verifyKakuro(content);
    const lines = board.map((_, r) =>
      cells
        .filter((cell) => cell.row === r)
        .map(({ row, col, digit }) => `{ row: ${row}, col: ${col}, digit: ${digit} }`)
        .join(", "),
    );
    const body = `import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "${slug}",
  title: "${title}",
  difficulty: ${difficultyArg},
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: ${rows},
  cols: ${cols},
  cells: [
${lines.filter(Boolean).map((line) => `    ${line},`).join("\n")}
  ],
} satisfies Content;
`;
    const dir = path.join(import.meta.dirname, "../../content/kakuro");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${slug}.ts`), body);
    console.log(`${slug}: ${cells.length} cells, layout ${attempt}, fill ${tries + 1}`);
    process.exit(0);
  }
}
