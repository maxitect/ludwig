import path from "node:path";
import { pathToFileURL } from "node:url";
import { deriveMessage } from "../src/puzzles/acrostic/derive";
import { gridWords } from "../src/puzzles/crossword/standards";
import { registry } from "../src/puzzles/registry";
import { type ContentFile, loadContentFiles } from "./content-files";

const MIN_LENGTH = 4;

type Contents = Record<string, Record<string, unknown>>;

const answerWords: Record<string, (content: Contents[string]) => string[]> = {
  crossword: (c) => gridWords(c.cells as Parameters<typeof gridWords>[0]),
  anagram: (c) => [String(c.answer)],
  "word-ladder": (c) => [
    String(c.startWord),
    String(c.endWord),
    ...(c.rungs as string[]),
  ],
  "word-wheel": (c) => [String(c.targetWord)],
  "word-search": (c) => c.words as string[],
  acrostic: (c) => [
    deriveMessage(
      c.rule as Parameters<typeof deriveMessage>[0],
      c.lines as string[],
    ),
  ],
  keyword: (c) => [String(c.keyword)],
};

export type Repeat = {
  word: string;
  files: string[];
  typeKeys: string[];
  crosswordRepeat: boolean;
};

/** Every answer word of four or more letters that appears in more than one content file. */
export function auditWords(
  files: Pick<ContentFile, "typeKey" | "slug" | "content">[],
) {
  const found = new Map<string, Map<string, string>>();
  for (const { typeKey, slug, content } of files) {
    const derive = answerWords[typeKey];
    if (!derive) continue;
    for (const raw of derive(content as Contents[string])) {
      const word = raw.toUpperCase();
      if (word.length < MIN_LENGTH) continue;
      const owners = found.get(word) ?? new Map<string, string>();
      owners.set(`${typeKey}/${slug}`, typeKey);
      found.set(word, owners);
    }
  }
  const repeats: Repeat[] = [];
  for (const [word, owners] of [...found].sort(([a], [b]) => a.localeCompare(b))) {
    if (owners.size < 2) continue;
    const typeKeys = [...owners.values()];
    repeats.push({
      word,
      files: [...owners.keys()],
      typeKeys,
      crosswordRepeat: typeKeys.filter((key) => key === "crossword").length > 1,
    });
  }
  return repeats;
}

export async function reportWordAudit(contentDir: string) {
  const { files } = await loadContentFiles(registry, contentDir);
  const repeats = auditWords(files);
  for (const { word, files: owners, crosswordRepeat } of repeats) {
    const level = crosswordRepeat ? "FAIL" : "warn";
    console.log(`${level} ${word}: ${owners.join(", ")}`);
  }
  const failures = repeats.filter(({ crosswordRepeat }) => crosswordRepeat);
  console.log(
    `content:audit-words: ${failures.length} crossword repeats, ${repeats.length - failures.length} warnings`,
  );
  return failures.length;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  reportWordAudit(path.resolve("content"))
    .then((failures) => {
      process.exitCode = failures ? 1 : 0;
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
