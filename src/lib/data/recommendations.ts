import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { eq, getViewSelectedFields, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  puzzleTypes,
  userSolves,
  userTypeActivity,
  userTypeStats,
} from "@/db/schema";
import { isPublished } from "@/lib/data/puzzles";
import { requireUser } from "@/lib/data/user";
import { recommend, type Candidate } from "@/lib/recommend";
import { londonDate } from "@/utils/london-time";

/** Every published puzzle that is not a daily or in a weekly pair, with its type and category names. Same for everyone. */
export async function getCandidates(): Promise<Candidate[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const rows = await db.query.puzzles.findMany({
    where: {
      RAW: (puzzle) => sql`${isPublished(puzzle)}
        and not exists (select 1 from daily_puzzles d where d.puzzle_id = ${puzzle.id})
        and not exists (select 1 from gear_daily g where g.puzzle_id = ${puzzle.id})
        and not exists (select 1 from weekly_puzzles w where w.puzzle_id = ${puzzle.id})`,
    },
    columns: { id: true, slug: true, title: true, difficulty: true },
    with: {
      type: {
        columns: { key: true, name: true },
        with: { category: { columns: { key: true, name: true } } },
      },
    },
  });
  return rows.map(({ type, ...puzzle }) => ({
    ...puzzle,
    typeKey: type.key,
    typeName: type.name,
    categoryKey: type.category.key,
    categoryName: type.category.name,
  }));
}

/** Types by solves across all users, most first, then catalogue order. Types nobody has solved still appear, last. */
async function getPopularTypeKeys() {
  "use cache";
  cacheLife("hours");
  cacheTag("puzzles");
  const rows = await db
    .select({ key: puzzleTypes.key })
    .from(puzzleTypes)
    .leftJoin(userSolves, eq(userSolves.typeKey, puzzleTypes.key))
    .groupBy(puzzleTypes.key, puzzleTypes.sort)
    .orderBy(sql`count(${userSolves.attemptId}) desc`, puzzleTypes.sort);
  return rows.map(({ key }) => key);
}

/** Medians per type and difficulty, for the step-up and the speed comparisons. */
async function getTypeDifficultyStats(userId: string) {
  const { rows } = await db.execute<{
    typeKey: string;
    difficulty: number;
    solves: number;
    medianDurationMs: number;
  }>(sql`
    select
      s.type_key as "typeKey",
      p.difficulty,
      count(*)::integer as solves,
      round(percentile_cont(0.5) within group (order by s.duration_ms))::integer as "medianDurationMs"
    from user_solves s
    join puzzles p on p.id = s.puzzle_id
    where s.user_id = ${userId}
    group by s.type_key, p.difficulty
  `);
  return rows;
}

/**
 * The Desk's recommendation shelf: the pure scorer over this user's activity and stats. The signal weights and
 * their reasons are in `src/lib/recommend.ts`; nothing is stored.
 */
export async function getRecommendations() {
  const { id: userId } = await requireUser();
  const [candidates, activity, stats, byDifficulty, favourites, solved] =
    await Promise.all([
      getCandidates(),
      db
        .select({
          ...getViewSelectedFields(userTypeActivity),
          categoryKey: puzzleTypes.categoryKey,
        })
        .from(userTypeActivity)
        .innerJoin(puzzleTypes, eq(puzzleTypes.key, userTypeActivity.typeKey))
        .where(eq(userTypeActivity.userId, userId)),
      db.select().from(userTypeStats).where(eq(userTypeStats.userId, userId)),
      getTypeDifficultyStats(userId),
      db.query.userFavouriteTypes.findMany({
        where: { userId },
        columns: { typeKey: true },
      }),
      db.query.attempts.findMany({
        where: { userId, completedAt: { isNotNull: true } },
        columns: { puzzleId: true },
      }),
    ]);
  const favouriteTypeKeys = favourites.map(({ typeKey }) => typeKey);
  const isColdStart = activity.length === 0 && favouriteTypeKeys.length === 0;

  return recommend({
    today: londonDate(new Date()),
    activity,
    stats: stats.map(({ avgHints, ...row }) => ({
      ...row,
      avgHints: Number(avgHints),
    })),
    byDifficulty,
    favouriteTypeKeys,
    solvedPuzzleIds: solved.map(({ puzzleId }) => puzzleId),
    candidates,
    popularTypeKeys: isColdStart ? await getPopularTypeKeys() : [],
  });
}
