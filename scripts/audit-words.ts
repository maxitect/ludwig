import path from "node:path";
import { pathToFileURL } from "node:url";
import { deriveMessage } from "../src/puzzles/acrostic/derive";
import { contentSchema as acrosticContent } from "../src/puzzles/acrostic/schema";
import { contentSchema as anagramContent } from "../src/puzzles/anagram/schema";
import { contentSchema as crosswordContent } from "../src/puzzles/crossword/schema";
import { gridWords } from "../src/puzzles/crossword/standards";
import { contentSchema as keywordContent } from "../src/puzzles/keyword/schema";
import { registry } from "../src/puzzles/registry";
import { contentSchema as wordLadderContent } from "../src/puzzles/word-ladder/schema";
import { contentSchema as wordSearchContent } from "../src/puzzles/word-search/schema";
import { contentSchema as wordWheelContent } from "../src/puzzles/word-wheel/schema";
import { type ContentFile, loadContentFiles } from "./content-files";

const MIN_LENGTH = 4;

const answerWords: Record<string, (content: unknown) => string[]> = {
  crossword: (c) => gridWords(crosswordContent.pick({ cells: true }).parse(c).cells),
  anagram: (c) => [anagramContent.pick({ answer: true }).parse(c).answer],
  "word-ladder": (c) => {
    const { startWord, endWord, rungs } = wordLadderContent.parse(c);
    return [startWord, endWord, ...rungs];
  },
  "word-wheel": (c) => [wordWheelContent.pick({ targetWord: true }).parse(c).targetWord],
  "word-search": (c) => wordSearchContent.pick({ words: true }).parse(c).words,
  acrostic: (c) => {
    const { rule, lines } = acrosticContent.parse(c);
    return [deriveMessage(rule, lines)];
  },
  keyword: (c) => [keywordContent.pick({ keyword: true }).parse(c).keyword],
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
    const words = derive(content).flatMap((answer) =>
      answer.toUpperCase().split(/[^A-Z]+/),
    );
    for (const word of words) {
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

/** Logs every repeat (crossword pairs as failures, the rest as warnings) and returns the failure count. */
export function reportWordAudit(
  files: Pick<ContentFile, "typeKey" | "slug" | "content">[],
) {
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
  loadContentFiles(registry, path.resolve("content"))
    .then(({ files }) => reportWordAudit(files))
    .then((failures) => {
      process.exitCode = failures ? 1 : 0;
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
