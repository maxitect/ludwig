import type { Payload, Solution } from "./schema";

/** The message the glyphs spell: each glyph's letter, words separated by a space. */
export function derivePlaintext({ words }: Solution) {
  return words.map((word) => word.join("")).join(" ");
}

/** The glyphs of the message, distinct and in neutral numeric order. This order names and lays out the key. */
export function glyphKeys({ words }: Pick<Payload, "words">) {
  return [...new Set(words.flat())].sort();
}

/** The glyph as named to the player: "glyph-07" is "Symbol 7". */
export function symbolName(assetKey: string) {
  return `Symbol ${Number(assetKey.slice("glyph-".length))}`;
}

/**
 * Stands each glyph in for a puzzle-local lowercase letter, in `glyphKeys` order, so the shared
 * cipher-key panel can work on glyphs. The letters have nothing to do with the glyphs' real letters.
 */
export function glyphCipher(payload: Pick<Payload, "words">) {
  const keys = glyphKeys(payload);
  const letterOf = (assetKey: string) =>
    String.fromCharCode(97 + keys.indexOf(assetKey));
  return {
    letterOf,
    assetKeyOf: (cipherLetter: string) => keys[cipherLetter.charCodeAt(0) - 97],
    ciphertext: payload.words
      .map((word) => word.map(letterOf).join(""))
      .join(" "),
  };
}
