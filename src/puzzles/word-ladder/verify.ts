import { checkLadder } from "./check";
import { readDictionaryFile } from "./dictionary";
import type { Content } from "./schema";

let dictionary: Set<string> | undefined;

/**
 * A word ladder has no uniqueness rule. The reference ladder only has to be valid: dictionary
 * words, one letter per step, the right endpoints and no repeats.
 */
export function verifyWordLadder({ startWord, endWord, rungs }: Content) {
  dictionary ??= new Set(readDictionaryFile());
  const known = dictionary;
  for (const word of [startWord, endWord]) {
    if (!known.has(word)) {
      throw new Error(`"${word}" is not in the dictionary`);
    }
  }
  const { rungProblems } = checkLadder(
    { startWord, endWord, rungCount: rungs.length },
    [startWord, ...rungs, endWord],
    (word) => known.has(word),
  );
  const [problem] = rungProblems;
  if (problem) {
    throw new Error(
      `reference rung ${problem.position + 1} "${rungs[problem.position]}" is invalid (${problem.reason})`,
    );
  }
}
