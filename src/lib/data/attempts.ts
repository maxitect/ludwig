import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptHints, attempts } from "@/db/schema";
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

/** The signed-in user's saved state for a puzzle, parsed by the type's `attemptSchema`, or null when there is none. */
export async function getAttemptState(
  userId: string,
  puzzleId: string,
  typeKey: string,
) {
  const attempt = await db.query.attempts.findFirst({
    where: { userId, puzzleId },
    columns: { id: true },
  });
  if (!attempt) return null;
  return getPuzzleModule(typeKey).loadAttemptState(attempt.id);
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
