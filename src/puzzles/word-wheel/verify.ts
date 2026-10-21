import { readDictionaryFile } from "../word-ladder/dictionary";
import { deriveWheel, validWords } from "./engine";
import type { Content } from "./schema";

export const MIN_VALID_WORDS = 15;

/**
 * The target must be a nine-letter dictionary word, the only one the wheel's letters make, and the
 * wheel must hold at least 15 valid words.
 */
export function verifyWheel(
  { targetWord, centrePosition, scrambleSeed, minLength }: Content,
  dictionary: readonly string[],
) {
  if (targetWord.length !== 9) {
    throw new Error(`"${targetWord}" is not nine letters`);
  }
  if (!dictionary.includes(targetWord)) {
    throw new Error(`"${targetWord}" is not in the dictionary`);
  }
  const wheel = deriveWheel(targetWord, centrePosition, scrambleSeed);
  const valid = validWords(wheel, minLength, dictionary);
  const nineLetter = valid.filter((word) => word.length === 9);
  if (nineLetter.length !== 1) {
    throw new Error(
      `the letters make ${nineLetter.length} nine-letter words: ${nineLetter.join(", ")}`,
    );
  }
  if (valid.length < MIN_VALID_WORDS) {
    throw new Error(
      `only ${valid.length} valid words, at least ${MIN_VALID_WORDS} needed`,
    );
  }
}

let dictionary: string[] | undefined;

export function verifyWordWheel(content: Content) {
  dictionary ??= readDictionaryFile();
  verifyWheel(content, dictionary);
}
