import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { solutionSchema } from "./schema";
import { words } from "./tables";

/** The reference rungs, and every dictionary word of the ladder's length for the checker to look rungs up in. */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.wordLadderPuzzles.findFirst({
    where: { puzzleId },
    columns: { startWord: true },
    with: {
      rungs: { columns: { word: true }, orderBy: { position: "asc" } },
    },
  });
  if (!puzzle) throw new Error(`Word ladder puzzle not found: ${puzzleId}`);
  const dictionary = await db
    .select({ word: words.word })
    .from(words)
    .where(eq(sql`length(${words.word})`, puzzle.startWord.length));
  return solutionSchema.parse({
    dictionary: dictionary.map(({ word }) => word),
    reference: puzzle.rungs.map(({ word }) => word),
  });
}
