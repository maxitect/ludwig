import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userSolves, userStreaks } from "@/db/schema";
import { dailyTypes } from "@/config/daily-types";
import { getSolvedPuzzleIds } from "@/lib/data/attempts";
import { isPublished } from "@/lib/data/puzzles";
import { requireUser } from "@/lib/data/user";
import { getWeeklySchedule } from "@/lib/data/weekly";
import { registry } from "@/puzzles/registry";
import { londonDate, londonMidnight, londonWeekStart } from "@/utils/london-time";

const CONTINUE_LIMIT = 8;

/** An attempt has saved state exactly when its type's `<type>_attempts` root row exists. */
const attemptsWithSavedState = sql.join(
  Object.values(registry).map(
    ({ attemptRoot }) => sql`select ${attemptRoot.attemptId} from ${attemptRoot}`,
  ),
  sql` union all `,
);

/**
 * Everything the signed-in home shows. Reads the session itself, so it is never cached across users.
 * Continue is one query: the unfinished attempts whose id appears in any type's attempt root table.
 */
export async function getDesk() {
  const { id: userId, name } = await requireUser();
  const now = new Date();
  const today = londonDate(now);
  const weekStart = londonWeekStart(now);

  const [continuing, todays, weeks, totals, streaks] = await Promise.all([
    db.query.attempts.findMany({
      where: {
        userId,
        completedAt: { isNull: true },
        RAW: (attempt) =>
          sql`${attempt.id} in (${attemptsWithSavedState})`,
      },
      columns: { lastSavedAt: true },
      orderBy: { lastSavedAt: "desc" },
      limit: CONTINUE_LIMIT,
      with: {
        puzzle: {
          columns: { typeKey: true, slug: true, title: true, difficulty: true },
          with: { type: { columns: { name: true } } },
        },
      },
    }),
    db.query.puzzles.findMany({
      where: {
        RAW: isPublished,
        OR: [
          { daily: { date: today, typeKey: { in: [...dailyTypes] } } },
          { gearDaily: { date: today } },
        ],
      },
      columns: {
        id: true,
        typeKey: true,
        slug: true,
        title: true,
        difficulty: true,
      },
      orderBy: { typeKey: "asc" },
      with: { type: { columns: { name: true } } },
    }),
    getWeeklySchedule(weekStart),
    db
      .select({
        total: sql<number>`count(*)::integer`,
        thisWeek: sql<number>`(count(*) filter (where ${userSolves.completedAt} >= ${londonMidnight(weekStart)}))::integer`,
      })
      .from(userSolves)
      .where(eq(userSolves.userId, userId)),
    db
      .select({
        current: userStreaks.currentStreak,
        longest: userStreaks.longestStreak,
      })
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId)),
  ]);

  const pair =
    weeks.find((week) => week.weekStart === weekStart)?.puzzles ?? [];
  const solvedIds = await getSolvedPuzzleIds([
    ...todays.map(({ id }) => id),
    ...pair.map(({ id }) => id),
  ]);
  const withSolved = <T extends { id: string }>(puzzle: T) => ({
    ...puzzle,
    solved: solvedIds.has(puzzle.id),
  });

  return {
    name,
    continuing,
    today: todays.map(withSolved),
    week: pair.map(withSolved),
    stats: {
      total: totals[0]?.total ?? 0,
      thisWeek: totals[0]?.thisWeek ?? 0,
      currentStreak: streaks[0]?.current ?? 0,
      longestStreak: streaks[0]?.longest ?? 0,
    },
  };
}
