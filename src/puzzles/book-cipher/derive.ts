export const LINE_WIDTH = 56;
export const LINES_PER_PAGE = 20;

export type TextLine = { page: number; line: number; content: string };
export type Reference = { page: number; line: number; wordIndex: number };

/**
 * Lays paragraphs out as numbered pages and lines: words are packed greedily into lines of at most
 * `LINE_WIDTH` characters, and every `LINES_PER_PAGE` lines make a page. Pages and lines count from 1.
 */
export function paginate(paragraphs: readonly string[]): TextLine[] {
  const rows: string[] = [];
  let current = "";
  for (const word of paragraphs.join(" ").split(/\s+/).filter(Boolean)) {
    if (current && current.length + 1 + word.length > LINE_WIDTH) {
      rows.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) rows.push(current);
  return rows.map((content, index) => ({
    page: Math.floor(index / LINES_PER_PAGE) + 1,
    line: (index % LINES_PER_PAGE) + 1,
    content,
  }));
}

/** The words of a line, split on whitespace and counted from 1 by `wordIndex`. */
export function wordsOfLine(content: string) {
  return content.split(/\s+/).filter(Boolean);
}

/** The lowercase letters of a word as printed, so punctuation and capitals never count. */
export function normaliseWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

/** The word a reference points at. Throws when the line or the word is not in the text, or the word has no letters. */
export function deriveWord(lines: readonly TextLine[], ref: Reference) {
  const line = lines.find(
    ({ page, line }) => page === ref.page && line === ref.line,
  );
  if (!line) throw new Error(`page ${ref.page}, line ${ref.line} does not exist`);
  const words = wordsOfLine(line.content);
  const word = words[ref.wordIndex - 1];
  if (word === undefined) {
    throw new Error(
      `page ${ref.page}, line ${ref.line} has ${words.length} words, so word ${ref.wordIndex} does not exist`,
    );
  }
  const normalised = normaliseWord(word);
  if (!normalised) {
    throw new Error(
      `page ${ref.page}, line ${ref.line}, word ${ref.wordIndex} has no letters`,
    );
  }
  return normalised;
}

/** The message the references spell: each referenced word, lowercase, in reference order. */
export function derivePlaintext(
  lines: readonly TextLine[],
  refs: readonly Reference[],
) {
  return refs.map((ref) => deriveWord(lines, ref)).join(" ");
}
