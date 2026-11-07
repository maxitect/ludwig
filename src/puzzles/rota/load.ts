import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.rotaPuzzles.findFirst({
    where: { puzzleId },
    columns: { brief: true, victimWorkerId: true },
    with: {
      workers: {
        columns: { id: true, name: true },
        orderBy: { name: "asc" },
        with: {
          squares: { columns: { phase: true, file: true, rank: true } },
        },
      },
      clues: {
        columns: {
          position: true,
          kind: true,
          displayText: true,
          speakerWorkerId: true,
        },
        orderBy: { position: "asc" },
        with: {
          unpoweredSquare: { columns: { file: true, rank: true } },
          neverInRank: { columns: { workerId: true, rank: true } },
          maxSwaps: { columns: { maxSwaps: true } },
          notInstigator: { columns: { workerId: true } },
        },
      },
    },
  });
  if (!puzzle) throw new Error(`Rota puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    brief: puzzle.brief,
    victimWorkerId: puzzle.victimWorkerId,
    workers: puzzle.workers,
    clues: puzzle.clues.map(
      ({ unpoweredSquare, neverInRank, maxSwaps, notInstigator, ...clue }) => ({
        ...clue,
        ...unpoweredSquare,
        ...neverInRank,
        ...maxSwaps,
        ...notInstigator,
      }),
    ),
  });
}
