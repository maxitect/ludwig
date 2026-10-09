import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.napkinMathsPuzzles.findFirst({
    where: { puzzleId },
    columns: { questionText: true },
    with: {
      lines: {
        columns: { content: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Napkin maths puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    questionText: puzzle.questionText,
    lines: puzzle.lines.map(({ content }) => content),
  });
}
