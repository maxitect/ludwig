import "server-only";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { puzzles } from "@/db/schema";
import { getPuzzleModule } from "@/puzzles/registry";

const published = and(
  isNotNull(puzzles.publishedAt),
  lte(puzzles.publishedAt, sql`now()`),
);

export async function getPuzzleForPlay(typeKey: string, slug: string) {
  const [puzzle] = await db
    .select({
      id: puzzles.id,
      typeKey: puzzles.typeKey,
      slug: puzzles.slug,
      title: puzzles.title,
      difficulty: puzzles.difficulty,
      volumeId: puzzles.volumeId,
      sourceNote: puzzles.sourceNote,
    })
    .from(puzzles)
    .where(
      and(eq(puzzles.typeKey, typeKey), eq(puzzles.slug, slug), published),
    );
  if (!puzzle) return null;
  const payload = await getPuzzleModule(typeKey).load(puzzle.id);
  return { puzzle, payload };
}

export async function getPublishedTypeKey(puzzleId: string) {
  const [row] = await db
    .select({ typeKey: puzzles.typeKey })
    .from(puzzles)
    .where(and(eq(puzzles.id, puzzleId), published));
  return row?.typeKey ?? null;
}

/** Loads the payload and solution server-side and runs the type's checker. */
export async function checkPuzzleAnswer(
  typeKey: string,
  puzzleId: string,
  answer: unknown,
) {
  const puzzleModule = getPuzzleModule(typeKey);
  const [payload, solution] = await Promise.all([
    puzzleModule.load(puzzleId),
    puzzleModule.loadSolution(puzzleId),
  ]);
  return puzzleModule.check(payload, solution, answer);
}
