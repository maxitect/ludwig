import "server-only";
import { generateScene } from "./engine";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

/**
 * The scenes are derived from the stored seed, count and version, which are read through
 * `loadSolution` and never leave this function. The difference regions are dropped here.
 */
export async function load(puzzleId: string) {
  const { sceneSeed, differenceCount, generatorVersion } =
    await loadSolution(puzzleId);
  const { original, altered } = generateScene(
    sceneSeed,
    differenceCount,
    generatorVersion,
  );
  return payloadSchema.parse({
    puzzleId,
    differenceCount,
    scenes: [original, altered],
  });
}
