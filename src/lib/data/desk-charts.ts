import "server-only";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  userDailySolves,
  userDifficultyStats,
  userSolves,
  userTypeStats,
} from "@/db/schema";
import { HEAT_WEEKS, SPARK_SOLVES } from "@/config/desk";
import { addDays } from "@/utils/london-time";

/**
 * Every chart on the Desk, read from the `user_*` views. Weeks begin on Monday in Europe/London.
 * `today` is the London date and `weekStart` the Monday of the current week.
 */
export async function getDeskCharts(
  userId: string,
  today: string,
  weekStart: string,
) {
  const heatStart = addDays(weekStart, -(HEAT_WEEKS - 1) * 7);

  const [days, weeks, pairs, categories, types, sparks, difficulties, fastest] =
    await Promise.all([
      db
        .select({ day: userDailySolves.day, solves: userDailySolves.solves })
        .from(userDailySolves)
        .where(
          sql`${userDailySolves.userId} = ${userId} and ${gte(userDailySolves.day, heatStart)}`,
        )
        .orderBy(asc(userDailySolves.day)),
      db.execute<{ week: string; solves: number }>(sql`
        select date_trunc('week', day)::date::text as week, sum(solves)::integer as solves
        from user_daily_solves
        where user_id = ${userId}
        group by 1
        order by 1
      `),
      db.execute<{ week: string }>(sql`
        select w.week_start::text as week
        from weekly_puzzles w
        join user_solves s on s.puzzle_id = w.puzzle_id and s.user_id = ${userId}
        group by w.week_start
        having count(*) = 2
        order by w.week_start
      `),
      db.execute<{
        key: string;
        name: string;
        published: number;
        solved: number;
        medianDurationMs: number | null;
      }>(sql`
        select
          c.key,
          c.name,
          (
            select count(*)::integer
            from puzzles p
            join puzzle_types t on t.key = p.type_key
            where t.category_key = c.key and p.published_at <= now()
          ) as published,
          coalesce(s.solves, 0)::integer as solved,
          s.median_duration_ms as "medianDurationMs"
        from puzzle_categories c
        left join user_category_stats s on s.category_key = c.key and s.user_id = ${userId}
        order by c.sort
      `),
      db
        .select({
          key: userTypeStats.typeKey,
          name: userTypeStats.typeName,
          categoryKey: userTypeStats.categoryKey,
          solves: userTypeStats.solves,
          bestDurationMs: userTypeStats.bestDurationMs,
          medianDurationMs: userTypeStats.medianDurationMs,
        })
        .from(userTypeStats)
        .where(eq(userTypeStats.userId, userId))
        .orderBy(desc(userTypeStats.solves), asc(userTypeStats.typeName)),
      db.execute<{ typeKey: string; durationMs: number }>(sql`
        select type_key as "typeKey", duration_ms as "durationMs"
        from (
          select
            type_key,
            duration_ms,
            completed_at,
            row_number() over (partition by type_key order by completed_at desc) as recency
          from user_solves
          where user_id = ${userId}
        ) recent
        where recency <= ${SPARK_SOLVES}
        order by type_key, completed_at
      `),
      db
        .select({
          difficulty: userDifficultyStats.difficulty,
          solves: userDifficultyStats.solves,
          medianDurationMs: userDifficultyStats.medianDurationMs,
        })
        .from(userDifficultyStats)
        .where(eq(userDifficultyStats.userId, userId))
        .orderBy(asc(userDifficultyStats.difficulty)),
      db
        .select({
          title: userSolves.puzzleTitle,
          typeName: userSolves.typeName,
          durationMs: userSolves.durationMs,
        })
        .from(userSolves)
        .where(eq(userSolves.userId, userId))
        .orderBy(asc(userSolves.durationMs))
        .limit(1),
    ]);

  const recent = new Map<string, number[]>();
  for (const { typeKey, durationMs } of sparks.rows) {
    recent.set(typeKey, [...(recent.get(typeKey) ?? []), durationMs]);
  }

  return {
    today,
    heatStart,
    days,
    weeks: weeks.rows,
    pairWeeks: pairs.rows.map(({ week }) => week),
    categories: categories.rows,
    types: types.map((type) => ({
      ...type,
      recent: recent.get(type.key) ?? [],
    })),
    difficulties,
    fastest: fastest[0] ?? null,
  };
}

export type DeskCharts = Awaited<ReturnType<typeof getDeskCharts>>;
