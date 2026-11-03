import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.reflectionsPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
    with: {
      fixedMirrors: {
        columns: { row: true, col: true, mirror: true },
        orderBy: { row: "asc", col: "asc" },
      },
      slots: {
        columns: { row: true, col: true },
        orderBy: { row: "asc", col: "asc" },
      },
      ports: {
        columns: { side: true, offset: true, label: true },
        orderBy: { label: "asc", side: "asc", offset: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Reflections puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
