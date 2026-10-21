import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.railroadPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      rows: true,
      cols: true,
      entryRow: true,
      entryCol: true,
      entrySide: true,
      exitRow: true,
      exitCol: true,
      exitSide: true,
    },
    with: {
      rowCounts: { columns: { count: true }, orderBy: { row: "asc" } },
      colCounts: { columns: { count: true }, orderBy: { col: "asc" } },
      givenPieces: {
        columns: { row: true, col: true, piece: true },
        orderBy: { row: "asc", col: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Railroad puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    rows: puzzle.rows,
    cols: puzzle.cols,
    entry: {
      row: puzzle.entryRow,
      col: puzzle.entryCol,
      side: puzzle.entrySide,
    },
    exit: { row: puzzle.exitRow, col: puzzle.exitCol, side: puzzle.exitSide },
    rowCounts: puzzle.rowCounts.map(({ count }) => count),
    colCounts: puzzle.colCounts.map(({ count }) => count),
    given: puzzle.givenPieces,
  });
}
