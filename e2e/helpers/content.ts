import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ContentMeta } from "../../scripts/content-files";
import type { Content as AnagramContent } from "../../src/puzzles/anagram/schema";
import type { Content as CrosswordContent } from "../../src/puzzles/crossword/schema";
import type { Content as GearContent } from "../../src/puzzles/gears/schema";
import type { Content as LogicGridContent } from "../../src/puzzles/logic-grid/schema";
import type { Content as ReverseChessContent } from "../../src/puzzles/reverse-chess/schema";
import { solve as solveFutoshiki } from "../../src/puzzles/futoshiki/engine";
import type { Content as FutoshikiContent } from "../../src/puzzles/futoshiki/schema";
import { solve } from "../../src/puzzles/sudoku/engine";
import type { Content as SudokuContent } from "../../src/puzzles/sudoku/schema";

type ContentFile<T> = { meta: ContentMeta; content: T };

const contentDir = path.resolve(__dirname, "../../content");

async function loadPublished<T>(typeKey: string) {
  const dir = path.join(contentDir, typeKey);
  const names = readdirSync(dir).filter((name) => name.endsWith(".ts"));
  const files = await Promise.all(
    names.map(
      (name) =>
        import(pathToFileURL(path.join(dir, name)).href) as Promise<
          ContentFile<T>
        >,
    ),
  );
  const now = new Date();
  return files.filter(
    ({ meta }) => meta.publishedAt && meta.publishedAt <= now,
  );
}

/** The first published puzzle of any type, for route-level checks that need only a valid solve URL. */
export async function firstPublishedSlug(typeKey: string) {
  const [first] = await loadPublished<unknown>(typeKey);
  if (!first) throw new Error(`No published puzzle in content/${typeKey}`);
  return first.meta.slug;
}

/** Any published anagram; the answer comes straight from its content file. */
export async function anagramPuzzle() {
  const [first] = await loadPublished<AnagramContent>("anagram");
  if (!first) throw new Error("No published anagram in content/anagram");
  return {
    typeKey: "anagram",
    slug: first.meta.slug,
    title: first.meta.title,
    letters: first.content.answer.replace(/[^a-z]/gi, "").toLowerCase(),
  };
}

/** Any published sudoku; its solution is solved from the givens in its content file. */
export async function sudokuPuzzle() {
  const [first] = await loadPublished<SudokuContent>("sudoku");
  if (!first) throw new Error("No published sudoku in content/sudoku");
  const solution = solve(first.content.givens);
  if (!solution) throw new Error(`Sudoku ${first.meta.slug} has no solution`);
  return {
    typeKey: "sudoku",
    slug: first.meta.slug,
    title: first.meta.title,
    givens: first.content.givens,
    solution,
  };
}

/** Any published futoshiki; its solution is solved from the puzzle in its content file. */
export async function futoshikiPuzzle() {
  const [first] = await loadPublished<FutoshikiContent>("futoshiki");
  if (!first) throw new Error("No published futoshiki in content/futoshiki");
  const solution = solveFutoshiki(first.content);
  if (!solution) throw new Error(`Futoshiki ${first.meta.slug} has no solution`);
  return {
    typeKey: "futoshiki",
    slug: first.meta.slug,
    title: first.meta.title,
    ...first.content,
    solution,
  };
}

/** Any published quick crossword, with its solution cells from the content file. */
export async function quickCrosswordPuzzle() {
  const all = await loadPublished<CrosswordContent>("crossword");
  const quick = all.find(({ content }) => content.style === "quick");
  if (!quick)
    throw new Error("No published quick crossword in content/crossword");
  return {
    typeKey: "crossword",
    slug: quick.meta.slug,
    title: quick.meta.title,
    cells: quick.content.cells,
  };
}

/** The largest published cryptic crossword, with its entry count. */
export async function largestCrypticCrosswordPuzzle() {
  const all = await loadPublished<CrosswordContent>("crossword");
  const [largest] = all
    .filter(({ content }) => content.style === "cryptic")
    .sort(
      (a, b) => b.content.rows * b.content.cols - a.content.rows * a.content.cols,
    );
  if (!largest) {
    throw new Error("No published cryptic crossword in content/crossword");
  }
  return {
    typeKey: "crossword",
    slug: largest.meta.slug,
    title: largest.meta.title,
    entries: largest.content.clues.length,
  };
}

/** Any published Mode A reverse chess puzzle whose last move captured a piece and promoted nothing. */
export async function uncapturePuzzle() {
  const all = await loadPublished<ReverseChessContent>("reverse-chess");
  const found = all.find(
    ({ content }) =>
      content.mode === "last_move" &&
      content.solutionPlies[0].uncapture &&
      !content.solutionPlies[0].unpromote,
  );
  const ply = found?.content.solutionPlies[0];
  if (!found || !ply?.uncapture) {
    throw new Error("No published uncapture puzzle in content/reverse-chess");
  }
  return {
    typeKey: "reverse-chess",
    slug: found.meta.slug,
    title: found.meta.title,
    sideToMove: found.content.sideToMove,
    from: `${ply.fromFile}${ply.fromRank}`,
    to: `${ply.toFile}${ply.toRank}`,
    uncapture: ply.uncapture,
  };
}

/** The easiest published curated gear diagram, plain or Fix the Diagram, with its solution from the content file. */
export async function gearPuzzle(fix: boolean) {
  const all = await loadPublished<GearContent>("gears");
  const found = all
    .filter(({ content }) => content.maxAdjustments > 0 === fix)
    .sort((a, b) => a.meta.difficulty - b.meta.difficulty)[0];
  if (!found) throw new Error("No published curated gear diagram");
  const { content } = found;
  const killer = content.gears.find(
    ({ label }) => label === content.solution.killerLabel,
  )!;
  return {
    typeKey: "gears",
    slug: found.meta.slug,
    title: found.meta.title,
    crank: content.solution.crank,
    convergence: content.solution.convergence,
    killer: `Gear ${killer.label}, ${killer.teeth} teeth`,
    swaps: content.solution.swaps,
  };
}

/** The published curated gear diagram with the most gears. */
export async function largestGearPuzzle() {
  const all = await loadPublished<GearContent>("gears");
  const found = all.sort(
    (a, b) => b.content.gears.length - a.content.gears.length,
  )[0];
  if (!found) throw new Error("No published curated gear diagram");
  return {
    typeKey: "gears",
    slug: found.meta.slug,
    gearCount: found.content.gears.length,
  };
}

/** A published logic grid, classic or the false-statement variant, with its households and false clue from the content file. */
export async function logicGridPuzzle(variant: boolean) {
  const all = await loadPublished<LogicGridContent>("logic-grid");
  const found = all
    .filter(({ content }) => content.clues.some((c) => c.isFalse) === variant)
    .sort((a, b) => a.meta.difficulty - b.meta.difficulty)[0];
  if (!found) throw new Error("No published logic grid of that kind");
  const { content } = found;
  return {
    typeKey: "logic-grid",
    slug: found.meta.slug,
    title: found.meta.title,
    households: content.solution,
    falseClue: content.clues.findIndex(({ isFalse }) => isFalse) + 1,
  };
}
