import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { puzzles } from "@/db/schema";
import { getPuzzleModule } from "@/puzzles/registry";

/** A null `published_at` never compares true, so drafts are excluded too. */
export const isPublished = (table: typeof puzzles) =>
  lte(table.publishedAt, sql`now()`);

const published = isPublished(puzzles);

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

/** Checks one cell against the server-side solution. Null when the type has no per-cell check. */
export async function checkPuzzleCell(
  typeKey: string,
  puzzleId: string,
  row: number,
  col: number,
  value: string,
) {
  const puzzleModule = getPuzzleModule(typeKey);
  if (!puzzleModule.checkCell) return null;
  const [payload, solution] = await Promise.all([
    puzzleModule.load(puzzleId),
    puzzleModule.loadSolution(puzzleId),
  ]);
  return puzzleModule.checkCell(payload, solution, row, col, value);
}

/** The single value at one cell. Null when the type has no per-cell reveal or the cell does not exist. */
export async function revealPuzzleCell(
  typeKey: string,
  puzzleId: string,
  row: number,
  col: number,
) {
  const puzzleModule = getPuzzleModule(typeKey);
  if (!puzzleModule.revealCell) return null;
  return puzzleModule.revealCell(
    await puzzleModule.loadSolution(puzzleId),
    row,
    col,
  );
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
