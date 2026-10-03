import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { userCategoryStats, userSolves, userStreaks } from "@/db/schema";

const RECENT_SOLVES = 10;

export async function getCasebook(userId: string) {
  const [streaks, categories, recent] = await Promise.all([
    db
      .select({
        current: userStreaks.currentStreak,
        longest: userStreaks.longestStreak,
      })
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId)),
    db
      .select({
        key: userCategoryStats.categoryKey,
        name: userCategoryStats.categoryName,
        solves: userCategoryStats.solves,
        medianDurationMs: userCategoryStats.medianDurationMs,
        bestDurationMs: userCategoryStats.bestDurationMs,
        avgHints: userCategoryStats.avgHints,
      })
      .from(userCategoryStats)
      .where(eq(userCategoryStats.userId, userId))
      .orderBy(userCategoryStats.categorySort),
    db
      .select({
        attemptId: userSolves.attemptId,
        typeKey: userSolves.typeKey,
        typeName: userSolves.typeName,
        puzzleSlug: userSolves.puzzleSlug,
        puzzleTitle: userSolves.puzzleTitle,
        completedAt: userSolves.completedAt,
        durationMs: userSolves.durationMs,
        hints: userSolves.hints,
      })
      .from(userSolves)
      .where(eq(userSolves.userId, userId))
      .orderBy(desc(userSolves.completedAt))
      .limit(RECENT_SOLVES),
  ]);
  return {
    currentStreak: streaks[0]?.current ?? 0,
    longestStreak: streaks[0]?.longest ?? 0,
    categories,
    recent,
  };
}
