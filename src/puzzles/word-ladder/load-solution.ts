import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { solutionSchema } from "./schema";
import { words } from "./tables";

/**
 * Every dictionary word of the ladder's length, for the checker to look rungs up in. The reference
 * rungs are not loaded: any valid ladder is accepted.
 */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.wordLadderPuzzles.findFirst({
    where: { puzzleId },
    columns: { startWord: true },
  });
  if (!puzzle) throw new Error(`Word ladder puzzle not found: ${puzzleId}`);
  const dictionary = await db
    .select({ word: words.word })
    .from(words)
    .where(eq(sql`length(${words.word})`, puzzle.startWord.length));
  return solutionSchema.parse({
    dictionary: dictionary.map(({ word }) => word),
  });
}
