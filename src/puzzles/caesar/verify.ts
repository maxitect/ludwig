import { lettersOf } from "../_shared/cipher-key/cipher-key";
import type { Content } from "./schema";

const MIN_LETTERS = 20;

/** The message is long enough to resist guessing. The shift is the one key, so the plaintext is the only answer. */
export function verifyCaesar({ plaintext }: Content) {
  const count = lettersOf(plaintext).length;
  if (count < MIN_LETTERS) {
    throw new Error(
      `the plaintext has ${count} letters, at least ${MIN_LETTERS} are needed`,
    );
  }
}
