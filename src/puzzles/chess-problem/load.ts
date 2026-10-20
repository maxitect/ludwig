import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.chessProblemPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      mateIn: true,
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
      enPassantFile: true,
    },
    with: {
      pieces: {
        columns: { file: true, rank: true, colour: true, piece: true },
        orderBy: { rank: "desc", file: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Chess problem not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
