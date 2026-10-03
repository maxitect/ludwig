import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ContentMeta } from "../../scripts/content-files";
import type { Content as AnagramContent } from "../../src/puzzles/anagram/schema";
import type { Content as CrosswordContent } from "../../src/puzzles/crossword/schema";

type ContentFile<T> = { meta: ContentMeta; content: T };

const contentDir = path.resolve(__dirname, "../../content");

async function loadAll<T>(typeKey: string) {
  const dir = path.join(contentDir, typeKey);
  const names = readdirSync(dir).filter((name) => name.endsWith(".ts"));
  return Promise.all(
    names.map(
      (name) =>
        import(pathToFileURL(path.join(dir, name)).href) as Promise<
          ContentFile<T>
        >,
    ),
  );
}

/** Any published anagram; the answer comes straight from its content file. */
export async function anagramPuzzle() {
  const [first] = await loadAll<AnagramContent>("anagram");
  return {
    typeKey: "anagram",
    slug: first.meta.slug,
    title: first.meta.title,
    letters: first.content.answer.replace(/[^a-z]/gi, "").toLowerCase(),
  };
}

/** Any published quick crossword, with its solution cells from the content file. */
export async function quickCrosswordPuzzle() {
  const all = await loadAll<CrosswordContent>("crossword");
  const quick = all.find(({ content }) => content.style === "quick");
  if (!quick) throw new Error("No quick crossword in content/crossword");
  return {
    typeKey: "crossword",
    slug: quick.meta.slug,
    title: quick.meta.title,
    cells: quick.content.cells,
  };
}
