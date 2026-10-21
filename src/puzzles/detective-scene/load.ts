import "server-only";
import { db } from "@/db";
import { getScene } from "./scenes";
import { payloadSchema } from "./schema";

/** Only the item positions are read, to count them. Titles and regions stay in `loadSolution`. */
export async function load(puzzleId: string) {
  const puzzle = await db.query.detectiveScenePuzzles.findFirst({
    where: { puzzleId },
    columns: { puzzleId: true, sceneKey: true, width: true, height: true },
    with: { items: { columns: { position: true } } },
  });
  if (!puzzle) {
    throw new Error(`Detective scene puzzle not found: ${puzzleId}`);
  }
  if (!getScene(puzzle.sceneKey)) {
    throw new Error(`Unknown detective scene: ${puzzle.sceneKey}`);
  }
  return payloadSchema.parse({
    puzzleId: puzzle.puzzleId,
    sceneKey: puzzle.sceneKey,
    width: puzzle.width,
    height: puzzle.height,
    itemCount: puzzle.items.length,
  });
}
