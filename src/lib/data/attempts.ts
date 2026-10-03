import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptHints, attempts } from "@/db/schema";
import { getCurrentUser } from "@/lib/data/user";
import { getPuzzleModule } from "@/puzzles/registry";

type HintKind = typeof attemptHints.$inferInsert.kind;

export async function getOrCreateAttempt(userId: string, puzzleId: string) {
  const columns = {
    id: attempts.id,
    completedAt: attempts.completedAt,
    durationMs: attempts.durationMs,
  };
  const [created] = await db
    .insert(attempts)
    .values({ userId, puzzleId })
    .onConflictDoNothing({ target: [attempts.userId, attempts.puzzleId] })
    .returning(columns);
  if (created) return created;
  const [existing] = await db
    .select(columns)
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.puzzleId, puzzleId)));
  return existing;
}

export async function replaceAttemptState(attemptId: string, state: unknown) {
  await db.transaction(async (tx) => {
    const [attempt] = await tx
      .select({ typeKey: attempts.typeKey })
      .from(attempts)
      .where(eq(attempts.id, attemptId));
    await getPuzzleModule(attempt.typeKey).replaceAttemptState(
      tx,
      attemptId,
      state,
    );
  });
}

async function findAttempt(userId: string, puzzleId: string) {
  return db.query.attempts.findFirst({
    where: { userId, puzzleId },
    columns: { id: true, typeKey: true },
  });
}

/** The user's saved state for a puzzle, parsed by the type's `attemptSchema`, or null when there is none. */
export async function getAttemptState(userId: string, puzzleId: string) {
  const attempt = await findAttempt(userId, puzzleId);
  if (!attempt) return null;
  return getPuzzleModule(attempt.typeKey).loadAttemptState(attempt.id);
}

export async function clearAttemptState(userId: string, puzzleId: string) {
  const attempt = await findAttempt(userId, puzzleId);
  if (!attempt) return;
  await getPuzzleModule(attempt.typeKey).clearAttemptState(attempt.id);
}

export async function recordHint(
  attemptId: string,
  kind: HintKind,
  row?: number,
  col?: number,
) {
  await db.insert(attemptHints).values({ attemptId, kind, row, col });
}

/** Sets completion once; the duration is clamped to `[0, now - started_at]`. */
export async function completeAttempt(attemptId: string, durationMs: number) {
  await db
    .update(attempts)
    .set({
      completedAt: sql`now()`,
      durationMs: sql`greatest(0, least(${durationMs}::bigint, floor(extract(epoch from (now() - ${attempts.startedAt})) * 1000)::bigint))::integer`,
    })
    .where(
      and(eq(attempts.id, attemptId), sql`${attempts.completedAt} is null`),
    );
}

/** The subset of `puzzleIds` the signed-in user has completed; empty when signed out. */
export async function getSolvedPuzzleIds(puzzleIds: string[]) {
  const user = await getCurrentUser();
  if (!user || puzzleIds.length === 0) return new Set<string>();
  const rows = await db.query.attempts.findMany({
    where: {
      userId: user.id,
      puzzleId: { in: puzzleIds },
      completedAt: { isNotNull: true },
    },
    columns: { puzzleId: true },
  });
  return new Set(rows.map(({ puzzleId }) => puzzleId));
}
