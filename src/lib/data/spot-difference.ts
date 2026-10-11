import "server-only";
import { getPublishedTypeKey } from "@/lib/data/puzzles";
import { loadSolution } from "@/puzzles/spot-difference/load-solution";
import { findDifferenceAt } from "@/puzzles/spot-difference/regions";

/** The regions of a published spot the difference puzzle, or null for any other puzzle. */
async function loadRegions(puzzleId: string) {
  if ((await getPublishedTypeKey(puzzleId)) !== "spot-difference") return null;
  return loadSolution(puzzleId);
}

/** The one difference a tap lands in: its index and region, or `{ found: null }` for a miss. */
export async function hitTestScene(
  puzzleId: string,
  point: { x: number; y: number },
) {
  const differences = await loadRegions(puzzleId);
  if (!differences) return null;
  return { found: findDifferenceAt(differences, point) };
}

/** The regions of the given differences only, so saved finds can be circled again after a reload. */
export async function getFoundRegions(puzzleId: string, indexes: number[]) {
  const differences = await loadRegions(puzzleId);
  if (!differences) return null;
  return differences.filter(({ index }) => indexes.includes(index));
}
