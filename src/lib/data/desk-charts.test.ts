import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attemptHints,
  attempts,
  circle9Puzzles,
  puzzleCategories,
  puzzleTypes,
  troixPuzzles,
  puzzles,
  userDailySolves,
  userDifficultyStats,
  userTypeStats,
} from "@/db/schema";
import { getDeskCharts } from "@/lib/data/desk-charts";
import { londonDate, londonWeekStart } from "@/utils/london-time";

const HOUR = 3_600_000;
let userId: string;
let otherUserId: string;
let puzzleIds: Record<string, string>;

const removePuzzles = () =>
  db.delete(puzzles).where(sql`${puzzles.slug} like 't160-%'`);

async function makePuzzle(slug: string, typeKey: string, difficulty: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({ typeKey, slug, title: slug, difficulty })
      .returning({ id: puzzles.id });
    if (typeKey === "circle9") {
      await tx.insert(circle9Puzzles).values({ puzzleId: row.id });
    } else {
      await tx.insert(troixPuzzles).values({ puzzleId: row.id, size: 6 });
    }
    return row.id;
  });
}

async function solve(
  who: string,
  slug: string,
  completedAt: string,
  durationMs: number,
) {
  const completed = new Date(completedAt);
  const [row] = await db
    .insert(attempts)
    .values({
      userId: who,
      puzzleId: puzzleIds[slug],
      startedAt: new Date(completed.getTime() - durationMs),
      completedAt: completed,
      durationMs,
    })
    .returning({ id: attempts.id });
  return row.id;
}

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: "__t160", name: "T160", sort: 98 })
    .onConflictDoNothing();
  await db
    .insert(puzzleTypes)
    .values(
      ["circle9", "troix"].map((key, index) => ({
        key,
        categoryKey: "__t160",
        name: key,
        description: "Test-only lookup",
        subtypeTable: `${key}_puzzles`,
        sort: 98 + index,
      })),
    )
    .onConflictDoNothing();
  await removePuzzles();
  puzzleIds = {
    "t160-a1": await makePuzzle("t160-a1", "circle9", 1),
    "t160-a2": await makePuzzle("t160-a2", "circle9", 1),
    "t160-a3": await makePuzzle("t160-a3", "circle9", 3),
    "t160-s1": await makePuzzle("t160-s1", "troix", 3),
    "t160-s2": await makePuzzle("t160-s2", "troix", 3),
  };
  userId = await createTestUser("t160");
  otherUserId = await createTestUser("t160b");
});

afterAll(async () => {
  await removePuzzles();
  await deleteTestUsers();
});

beforeEach(async () => {
  await db.delete(attempts).where(eq(attempts.userId, userId));
  await db.delete(attempts).where(eq(attempts.userId, otherUserId));
});

describe("user_daily_solves", () => {
  it("groups by London day: 23:30 UTC in BST is the next day, in GMT the same day", async () => {
    await solve(userId, "t160-a1", "2025-07-01T10:00:00Z", 1000);
    await solve(userId, "t160-a2", "2025-07-01T23:30:00Z", 2000);
    await solve(userId, "t160-a3", "2025-01-01T23:30:00Z", 4000);
    await solve(userId, "t160-s1", "2025-01-01T09:00:00Z", 8000);
    await solve(otherUserId, "t160-s2", "2025-07-01T10:00:00Z", 500);
    const rows = await db
      .select({
        day: userDailySolves.day,
        solves: userDailySolves.solves,
        totalDurationMs: userDailySolves.totalDurationMs,
      })
      .from(userDailySolves)
      .where(eq(userDailySolves.userId, userId))
      .orderBy(userDailySolves.day);
    expect(rows).toEqual([
      { day: "2025-01-01", solves: 2, totalDurationMs: 12000 },
      { day: "2025-07-01", solves: 1, totalDurationMs: 1000 },
      { day: "2025-07-02", solves: 1, totalDurationMs: 2000 },
    ]);
  });

  it("ignores unfinished attempts", async () => {
    await db.insert(attempts).values({ userId, puzzleId: puzzleIds["t160-a1"] });
    expect(
      await db
        .select()
        .from(userDailySolves)
        .where(eq(userDailySolves.userId, userId)),
    ).toEqual([]);
  });
});

describe("user_type_stats", () => {
  it("matches hand-computed count, median, best, average hints and last solved per type", async () => {
    const first = await solve(userId, "t160-a1", "2025-03-01T10:00:00Z", 10_000);
    await solve(userId, "t160-a2", "2025-03-02T10:00:00Z", 30_000);
    await solve(userId, "t160-a3", "2025-03-03T10:00:00Z", 20_000);
    await solve(userId, "t160-s1", "2025-03-04T10:00:00Z", 5 * HOUR);
    await db.insert(attemptHints).values([
      { attemptId: first, kind: "check_cell", row: 0, col: 0 },
      { attemptId: first, kind: "check_cell", row: 0, col: 1 },
      { attemptId: first, kind: "check_all" },
    ]);
    const rows = await db
      .select()
      .from(userTypeStats)
      .where(eq(userTypeStats.userId, userId))
      .orderBy(userTypeStats.typeKey);
    expect(rows).toMatchObject([
      {
        typeKey: "circle9",
        solves: 3,
        medianDurationMs: 20_000,
        bestDurationMs: 10_000,
        avgHints: "1.00",
      },
      {
        typeKey: "troix",
        solves: 1,
        medianDurationMs: 5 * HOUR,
        bestDurationMs: 5 * HOUR,
        avgHints: "0.00",
      },
    ]);
    expect(rows[0].lastSolvedAt.toISOString()).toBe("2025-03-03T10:00:00.000Z");
  });
});

describe("user_difficulty_stats", () => {
  it("matches the solve count and median per difficulty", async () => {
    await solve(userId, "t160-a1", "2025-03-01T10:00:00Z", 10_000);
    await solve(userId, "t160-a2", "2025-03-02T10:00:00Z", 30_000);
    await solve(userId, "t160-a3", "2025-03-03T10:00:00Z", 100_000);
    await solve(userId, "t160-s1", "2025-03-04T10:00:00Z", 200_000);
    expect(
      await db
        .select({
          difficulty: userDifficultyStats.difficulty,
          solves: userDifficultyStats.solves,
          medianDurationMs: userDifficultyStats.medianDurationMs,
        })
        .from(userDifficultyStats)
        .where(eq(userDifficultyStats.userId, userId))
        .orderBy(userDifficultyStats.difficulty),
    ).toEqual([
      { difficulty: 1, solves: 2, medianDurationMs: 20_000 },
      { difficulty: 3, solves: 2, medianDurationMs: 150_000 },
    ]);
  });
});

describe("getDeskCharts", () => {
  it("reads only the given user's solves", async () => {
    const now = Date.now();
    const ago = (hours: number) => new Date(now - hours * HOUR).toISOString();
    await solve(userId, "t160-a1", ago(1), 10_000);
    await solve(userId, "t160-s1", ago(30), 40_000);
    await solve(otherUserId, "t160-a2", ago(2), 1_000);
    await solve(otherUserId, "t160-a3", ago(3), 2_000);
    await solve(otherUserId, "t160-s2", ago(4), 3_000);

    const charts = await getDeskCharts(
      userId,
      londonDate(new Date(now)),
      londonWeekStart(new Date(now)),
    );

    expect(charts.days.reduce((sum, { solves }) => sum + solves, 0)).toBe(2);
    expect(charts.weeks.reduce((sum, { solves }) => sum + solves, 0)).toBe(2);
    expect(
      charts.types.map(({ key, solves, recent }) => ({ key, solves, recent })),
    ).toEqual([
      { key: "circle9", solves: 1, recent: [10_000] },
      { key: "troix", solves: 1, recent: [40_000] },
    ]);
    expect(charts.difficulties).toEqual([
      { difficulty: 1, solves: 1, medianDurationMs: 10_000 },
      { difficulty: 3, solves: 1, medianDurationMs: 40_000 },
    ]);
    expect(charts.categories.reduce((sum, { solved }) => sum + solved, 0)).toBe(
      2,
    );
    expect(charts.fastest?.durationMs).toBe(10_000);
  });
});

describe("no stored stats", () => {
  it("has no counter or stat column on any table", async () => {
    const { rows } = await db.execute(sql`
      select column_name from information_schema.columns
      where table_schema = 'public'
        and table_name not in (select table_name from information_schema.views where table_schema = 'public')
        and column_name ~ '(streak|solves|median|best_duration|avg_hints|hints_used|total_duration|solved)'
        and column_name <> 'notify_streak'
    `);
    expect(rows).toEqual([]);
  });
});
