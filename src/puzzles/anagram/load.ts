import "server-only";
import { db } from "@/db";
import { deriveTiles, deriveWordLengths } from "./derive";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

/**
 * The tiles are a scramble of the answer, so the answer is read through `loadSolution`
 * to derive them and never leaves this function.
 */
export async function load(puzzleId: string) {
  const [puzzle, answer] = await Promise.all([
    db.query.anagramPuzzles.findFirst({
      where: { puzzleId },
      columns: { definitionHint: true, scrambleSeed: true },
    }),
    loadSolution(puzzleId),
  ]);
  if (!puzzle) throw new Error(`Anagram puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    definitionHint: puzzle.definitionHint,
    tiles: deriveTiles(answer, puzzle.scrambleSeed),
    wordLengths: deriveWordLengths(answer),
  });
}
