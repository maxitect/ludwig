import { deriveTiles, lettersOf } from "./derive";
import type { Content } from "./schema";

/** The tiles must be a permutation of the answer letters that is not the answer. */
export function verifyAnagram({ answer, scrambleSeed }: Content) {
  const letters = lettersOf(answer);
  const tiles = deriveTiles(answer, scrambleSeed);
  if ([...tiles].sort().join("") !== [...letters].sort().join("")) {
    throw new Error("tiles are not a permutation of the answer letters");
  }
  if (tiles.join("") === letters) {
    throw new Error("the scramble equals the answer");
  }
}
