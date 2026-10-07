import { lettersOf } from "../_shared/cipher-key/cipher-key";
import type { Content } from "./schema";

const MIN_LETTERS = 20;
const MIN_DISTINCT_GLYPHS = 8;
const MIN_READABLE_WORD = 3;
const MAX_UNKNOWN_IN_WORD = 2;

/**
 * Glyphs the player can work out. Starting from the given letters, a word is readable when it has
 * at least three letters, at most two unknown glyphs and at least half its letters known: the known
 * letters then pin the rest down. A readable word gives away its unknown glyphs, and the rule repeats
 * until nothing changes.
 */
function inferable(words: string[], given: Iterable<string>) {
  const known = new Set(given);
  let changed = true;
  while (changed) {
    changed = false;
    for (const word of words) {
      if (word.length < MIN_READABLE_WORD) continue;
      const unknown = new Set([...word].filter((letter) => !known.has(letter)));
      const knownCount = [...word].filter((letter) => known.has(letter)).length;
      if (
        unknown.size > 0 &&
        unknown.size <= MAX_UNKNOWN_IN_WORD &&
        knownCount * 2 >= word.length
      ) {
        unknown.forEach((letter) => known.add(letter));
        changed = true;
      }
    }
  }
  return known;
}

/**
 * The message is long enough and varied enough, the given glyphs are real and used, and every other
 * glyph in the message can be inferred from the given ones by reading words. The glyph-to-letter mapping is global, so
 * the plaintext fixes every glyph and the only answer is the message itself.
 */
export function verifyPictogramCipher({ plaintext, given }: Content) {
  const letters = lettersOf(plaintext);
  const distinct = new Set(letters);
  if (letters.length < MIN_LETTERS) {
    throw new Error(
      `the plaintext has ${letters.length} letters, at least ${MIN_LETTERS} are needed`,
    );
  }
  if (distinct.size < MIN_DISTINCT_GLYPHS) {
    throw new Error(
      `the plaintext uses ${distinct.size} distinct glyphs, at least ${MIN_DISTINCT_GLYPHS} are needed`,
    );
  }
  if (new Set(given).size !== given.length) {
    throw new Error("a given glyph is listed twice");
  }
  const unused = given.filter((letter) => !distinct.has(letter));
  if (unused.length) {
    throw new Error(
      `given glyph(s) ${unused.join(", ")} do not occur in the message`,
    );
  }
  if (given.length >= distinct.size) {
    throw new Error("every glyph is given, so nothing is left to solve");
  }
  const known = inferable(plaintext.split(" "), given);
  const stuck = [...distinct].filter((letter) => !known.has(letter));
  if (stuck.length) {
    throw new Error(
      `glyph(s) for ${stuck.join(", ")} cannot be inferred from the given glyphs`,
    );
  }
}
