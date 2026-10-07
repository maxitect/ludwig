import { lettersOf } from "../_shared/cipher-key/cipher-key";
import { keywordAlphabet } from "./derive";
import type { Content } from "./schema";

const MIN_LETTERS = 20;

/** The message is long enough to resist guessing, and the keyword is all letters and really reorders the alphabet. */
export function verifyKeyword({ plaintext, keyword }: Content) {
  const count = lettersOf(plaintext).length;
  if (count < MIN_LETTERS) {
    throw new Error(
      `the plaintext has ${count} letters, at least ${MIN_LETTERS} are needed`,
    );
  }
  if (lettersOf(keyword) !== keyword) {
    throw new Error("the keyword must contain letters only");
  }
  if (keywordAlphabet(keyword).startsWith("abcdefghijklmnopqrstuvwxyz")) {
    throw new Error("the keyword leaves the alphabet unchanged");
  }
}
