import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.gearTrainPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true, targetClockwise: true },
    with: {
      fixedCogs: { columns: { role: true, row: true, col: true, teeth: true } },
      bolts: {
        columns: { row: true, col: true },
        orderBy: { row: "asc", col: "asc" },
      },
      inventory: {
        columns: { teeth: true, count: true },
        orderBy: { teeth: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Gear train puzzle not found: ${puzzleId}`);
  const fixed = (role: "driver" | "target") => {
    const found = puzzle.fixedCogs.find((cog) => cog.role === role);
    if (!found) throw new Error(`Gear train ${puzzleId} has no ${role}`);
    const { row, col, teeth } = found;
    return { row, col, teeth };
  };
  return payloadSchema.parse({
    rows: puzzle.rows,
    cols: puzzle.cols,
    targetClockwise: puzzle.targetClockwise,
    driver: fixed("driver"),
    target: fixed("target"),
    bolts: puzzle.bolts,
    inventory: puzzle.inventory,
  });
}
