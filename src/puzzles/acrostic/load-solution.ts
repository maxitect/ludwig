import "server-only";
import { db } from "@/db";
import { deriveMessage } from "./derive";
import { solutionSchema } from "./schema";

/** The message is derived from the lines, never stored. */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.acrosticPuzzles.findFirst({
    where: { puzzleId },
    columns: { rule: true },
    with: {
      lines: { columns: { content: true }, orderBy: { position: "asc" } },
    },
  });
  if (!puzzle) throw new Error(`Acrostic puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(
    deriveMessage(
      puzzle.rule,
      puzzle.lines.map(({ content }) => content),
    ),
  );
}
