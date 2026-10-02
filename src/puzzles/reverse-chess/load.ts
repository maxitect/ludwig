import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.reverseChessPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      mode: true,
      sideToMove: true,
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
      enPassantFile: true,
      halfmove: true,
      fullmove: true,
      goalText: true,
      plyCount: true,
    },
    with: {
      pieces: {
        columns: { file: true, rank: true, colour: true, piece: true },
        orderBy: { rank: "desc", file: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Reverse chess puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
