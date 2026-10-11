import "server-only";
import { db } from "@/db";
import { getScene } from "./scenes";
import { payloadSchema } from "./schema";

/** Only the difference indexes are read, to count them. The regions stay in `loadSolution`. */
export async function load(puzzleId: string) {
  const puzzle = await db.query.spotDifferencePuzzles.findFirst({
    where: { puzzleId },
    columns: { puzzleId: true, sceneKey: true },
    with: { differences: { columns: { differenceIndex: true } } },
  });
  if (!puzzle) {
    throw new Error(`Spot the difference puzzle not found: ${puzzleId}`);
  }
  const scene = getScene(puzzle.sceneKey);
  if (!scene) {
    throw new Error(`Unknown spot the difference scene: ${puzzle.sceneKey}`);
  }
  return payloadSchema.parse({
    puzzleId: puzzle.puzzleId,
    sceneKey: puzzle.sceneKey,
    width: scene.width,
    height: scene.height,
    differenceCount: puzzle.differences.length,
  });
}
