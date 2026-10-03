import "server-only";
import { getPublishedTypeKey } from "@/lib/data/puzzles";
import { findDifferenceAt, generateScene } from "@/puzzles/spot-difference/engine";
import { loadSolution } from "@/puzzles/spot-difference/load-solution";

/** The derived differences of a published spot the difference puzzle, or null for any other puzzle. */
async function loadDifferences(puzzleId: string) {
  if ((await getPublishedTypeKey(puzzleId)) !== "spot-difference") return null;
  const { sceneSeed, differenceCount, generatorVersion } =
    await loadSolution(puzzleId);
  return generateScene(sceneSeed, differenceCount, generatorVersion)
    .differences;
}

/** The one difference a tap lands in: its index and region, or `{ found: null }` for a miss. */
export async function hitTestScene(
  puzzleId: string,
  point: { x: number; y: number },
) {
  const differences = await loadDifferences(puzzleId);
  if (!differences) return null;
  const hit = findDifferenceAt(differences, point);
  return { found: hit ? { index: hit.index, region: hit.region } : null };
}

/** The regions of the given differences only, so saved finds can be circled again after a reload. */
export async function getFoundRegions(puzzleId: string, indexes: number[]) {
  const differences = await loadDifferences(puzzleId);
  if (!differences) return null;
  return differences
    .filter(({ index }) => indexes.includes(index))
    .map(({ index, region }) => ({ index, region }));
}
