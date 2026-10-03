import { SCENE_HEIGHT, SCENE_WIDTH, generateScene } from "./engine";
import type { Content } from "./schema";

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

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
    if (
      region.x < 0 ||
      region.y < 0 ||
      region.x + region.width > SCENE_WIDTH ||
      region.y + region.height > SCENE_HEIGHT
    ) {
      throw new Error(`difference ${i} lies outside the scene`);
    }
    for (const [j, other] of differences.entries()) {
      if (j > i && overlap(region, other.region)) {
        throw new Error(`differences ${i} and ${j} overlap`);
      }
    }
  }
}
