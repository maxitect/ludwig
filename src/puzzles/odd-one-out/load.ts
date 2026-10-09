import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.oddOneOutPuzzles.findFirst({
    where: { puzzleId },
    columns: { promptText: true },
    with: {
      items: {
        columns: { position: true, label: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Odd one out puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
