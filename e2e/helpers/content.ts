import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ContentMeta } from "../../scripts/content-files";
import type { Content as AnagramContent } from "../../src/puzzles/anagram/schema";
import type { Content as CrosswordContent } from "../../src/puzzles/crossword/schema";
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
