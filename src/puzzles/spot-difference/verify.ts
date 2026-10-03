import { generateScene, inCanvas, overlaps } from "./engine";
import type { Content } from "./schema";

/**
 * The derivation must produce exactly `differenceCount` differences, with separate regions
 * inside the scene, and the two scenes must actually differ. The stored seed, count and
 * version are the whole solution, so it is unique by construction.
 */
export function verifySpotDifference({
  sceneSeed,
  differenceCount,
  generatorVersion,
}: Content) {
  const { original, altered, differences } = generateScene(
    sceneSeed,
    differenceCount,
    generatorVersion,
  );
  if (differences.length !== differenceCount) {
    throw new Error(
      `generated ${differences.length} differences, expected ${differenceCount}`,
    );
  }
  if (JSON.stringify(original) === JSON.stringify(altered)) {
    throw new Error("the two scenes are identical");
  }
  for (const [i, { region }] of differences.entries()) {
    if (!inCanvas(region)) {
      throw new Error(`difference ${i} lies outside the scene`);
    }
    for (const [j, other] of differences.entries()) {
      if (j > i && overlaps(region, other.region)) {
        throw new Error(`differences ${i} and ${j} overlap`);
      }
    }
  }
}
