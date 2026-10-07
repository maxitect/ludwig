import { ALPHABET, lettersOf } from "../_shared/cipher-key/cipher-key";

/** The keyword's letters once each in order, then the rest of the alphabet in order. */
export function keywordAlphabet(keyword: string) {
  return [...new Set([...lettersOf(keyword), ...ALPHABET])].join("");
}

/** Replaces each plain letter with the one at its place in the keyword alphabet. The result is uppercase and non-letters pass through. */
export function deriveCiphertext(plaintext: string, keyword: string) {
  const alphabet = keywordAlphabet(keyword);
  return plaintext.replace(/[a-z]/gi, (letter) =>
    alphabet[ALPHABET.indexOf(letter.toLowerCase())].toUpperCase(),
  );
}
