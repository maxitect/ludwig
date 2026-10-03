import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptHints, attempts } from "@/db/schema";
import { getPublishedTypeKey } from "@/lib/data/puzzles";
import { getCurrentUser, requireUser } from "@/lib/data/user";
import type { MergeEntry } from "@/lib/forms/local-progress";
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
  if (puzzleIds.length === 0) return new Set<string>();
  const user = await getCurrentUser();
  if (!user) return new Set<string>();
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

/**
 * Merges signed-out progress into the user's attempts. The server wins on conflict:
 * local state is written only when the server has none, and local completion is carried
 * over only when the server attempt is not complete, with the duration clamped to the local
 * start-to-completion window. Entries that don't validate are skipped.
 */
export async function mergeLocalProgress(entries: MergeEntry[]) {
  const { id: userId } = await requireUser();
  for (const entry of entries) {
    const typeKey = await getPublishedTypeKey(entry.puzzleId);
    if (typeKey === null || typeKey !== entry.typeKey) continue;
    const puzzleModule = getPuzzleModule(typeKey);
    const state = puzzleModule.schema.attemptSchema.safeParse(entry.state);
    if (!state.success) continue;

    const attempt = await getOrCreateAttempt(userId, entry.puzzleId);
    if ((await puzzleModule.loadAttemptState(attempt.id)) === null) {
      await replaceAttemptState(attempt.id, state.data);
    }
    if (entry.completedAt !== undefined && attempt.completedAt === null) {
      const completedAt = Math.min(entry.completedAt, Date.now());
      const startedAt = Math.min(entry.startedAt, completedAt);
      await db
        .update(attempts)
        .set({
          startedAt: sql`least(${attempts.startedAt}, ${new Date(startedAt)})`,
          completedAt: new Date(completedAt),
          durationMs:
            entry.durationMs === undefined
              ? null
              : Math.min(entry.durationMs, completedAt - startedAt),
        })
        .where(
          and(eq(attempts.id, attempt.id), sql`${attempts.completedAt} is null`),
        );
    }
  }
}
