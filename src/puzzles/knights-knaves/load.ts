import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.knightsKnavesPuzzles.findFirst({
    where: { puzzleId },
    columns: { questionText: true },
    with: {
      characters: {
        columns: { position: true, name: true },
        orderBy: { position: "asc" },
        with: {
          statements: {
            columns: { content: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!puzzle) throw new Error(`Knights and knaves puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    questionText: puzzle.questionText,
    characters: puzzle.characters.map(({ position, name, statements }) => ({
      position,
      name,
      statements: statements.map(({ content }) => content),
    })),
  });
}
