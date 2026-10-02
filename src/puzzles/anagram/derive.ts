import { mulberry32 } from "../_shared/prng";

const MAX_SHUFFLES = 64;

/** Lowercase letters only: spaces, case and punctuation never count towards an answer. */
export function lettersOf(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

/** The letter count of each word, which sets how the answer slots are grouped. */
export function deriveWordLengths(answer: string) {
  return answer
    .split(/\s+/)
    .map((word) => lettersOf(word).length)
    .filter((length) => length > 0);
}

/** A seeded shuffle of the answer letters that is never the answer itself. */
export function deriveTiles(answer: string, seed: number) {
  const letters = [...lettersOf(answer)];
  const random = mulberry32(seed);
  for (let round = 0; round < MAX_SHUFFLES; round++) {
    const tiles = [...letters];
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    if (tiles.join("") !== letters.join("")) return tiles;
  }
  throw new Error(`No distinct scramble exists for "${answer}"`);
}
