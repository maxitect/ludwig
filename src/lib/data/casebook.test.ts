import { eq, sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attemptHints,
  attempts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  userCategoryStats,
  userSolves,
  userStreaks,
} from "@/db/schema";
import { fixtureModule } from "@/puzzles/__fixture/module";
import { londonMidnight } from "@/utils/london-time";

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth")>();
  const api = Object.create(original.auth.api, {
    getSession: {
      value: async () =>
        session.userId ? { user: { id: session.userId } } : null,
    },
  });
  return { ...original, auth: { ...original.auth, api } };
});

const { getCasebook } = await import("./casebook");

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
let userId: string;
let puzzleIds: string[];

const removePuzzles = () =>
  db.delete(puzzles).where(sql`${puzzles.slug} like 't023-%'`);

async function makePuzzle(name: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({ typeKey: "__fixture", slug: name, title: name, difficulty: 1 })
      .returning({ id: puzzles.id });
    await fixtureModule.upsertContent(tx, row.id, {
      note: "alpha",
      items: [{ position: 0, label: "alpha" }],
    });
    return row.id;
  });
}

async function solve(puzzleIndex: number, completedAt: Date, durationMs = 1000) {
  const [row] = await db
    .insert(attempts)
    .values({
      userId,
      puzzleId: puzzleIds[puzzleIndex],
      startedAt: new Date(completedAt.getTime() - durationMs),
      completedAt,
      durationMs,
    })
    .returning({ id: attempts.id });
  return row.id;
}

const streaks = async () =>
  (await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)))[0];

/** Noon in London on the given day, so the instant sits well inside it in both GMT and BST. */
const londonNoon = (date: string) =>
  new Date(londonMidnight(date).getTime() + 12 * HOUR);

async function londonToday() {
  const { rows } = await db.execute<{ today: string }>(
    sql`select to_char((now() at time zone 'Europe/London')::date, 'YYYY-MM-DD') as today`,
  );
  return rows[0].today;
}

async function londonDayOffset(offset: number) {
  const today = londonMidnight(await londonToday());
  return londonNoon(
    new Date(today.getTime() + offset * DAY + 12 * HOUR)
      .toISOString()
      .slice(0, 10),
  );
}

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: "__fixture", name: "Fixture", sort: 99 })
    .onConflictDoNothing();
  await db
    .insert(puzzleTypes)
    .values({
      key: "__fixture",
      categoryKey: "__fixture",
      name: "Fixture",
      description: "Test-only type",
      subtypeTable: "fixture_puzzles",
      sort: 99,
    })
    .onConflictDoNothing();
  await removePuzzles();
  puzzleIds = await Promise.all(
    Array.from({ length: 7 }, (_, index) => makePuzzle(`t023-${index}`)),
  );
  userId = await createTestUser("t023");
});

afterAll(async () => {
  await removePuzzles();
  await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "__fixture"));
  await db
    .delete(puzzleCategories)
    .where(eq(puzzleCategories.key, "__fixture"));
  await deleteTestUsers();
});

beforeEach(async () => {
  await db.delete(attempts).where(eq(attempts.userId, userId));
});

describe("user_solves", () => {
  it("lists completed attempts only and derives the hint count from attempt_hints", async () => {
    const id = await solve(0, new Date());
    await db.insert(attempts).values({ userId, puzzleId: puzzleIds[1] });
    await db.insert(attemptHints).values([
      { attemptId: id, kind: "check_cell", row: 0, col: 0 },
      { attemptId: id, kind: "reveal_cell", row: 0, col: 1 },
    ]);
    const rows = await db
      .select({ attemptId: userSolves.attemptId, hints: userSolves.hints })
      .from(userSolves)
      .where(eq(userSolves.userId, userId));
    expect(rows).toEqual([{ attemptId: id, hints: 2 }]);
  });
});

describe("user_streaks", () => {
  it("counts consecutive London days, splitting on a gap, for D-3 to D and D-6", async () => {
    for (const [index, offset] of [-3, -2, -1, 0, -6].entries()) {
      await solve(index, await londonDayOffset(offset));
    }
    expect(await streaks()).toMatchObject({ currentStreak: 4, longestStreak: 4 });
  });

  it("keeps the streak alive when the latest solve was yesterday", async () => {
    await solve(0, await londonDayOffset(-2));
    await solve(1, await londonDayOffset(-1));
    expect(await streaks()).toMatchObject({ currentStreak: 2, longestStreak: 2 });
  });

  it("resets the current streak after a missed day but keeps the longest", async () => {
    await solve(0, await londonDayOffset(-5));
    await solve(1, await londonDayOffset(-4));
    await solve(2, await londonDayOffset(-3));
    expect(await streaks()).toMatchObject({ currentStreak: 0, longestStreak: 3 });
  });

  it("puts 23:30 UTC in BST on the next London day", async () => {
    await solve(0, new Date("2025-07-01T23:30:00Z"));
    await solve(1, londonNoon("2025-07-03"));
    expect(await streaks()).toMatchObject({ longestStreak: 2 });
  });

  it("puts 23:30 UTC in GMT on the same London day", async () => {
    await solve(0, new Date("2025-01-01T23:30:00Z"));
    await solve(1, londonNoon("2025-01-03"));
    expect(await streaks()).toMatchObject({ longestStreak: 1 });
  });

  it("has no row for a user without solves", async () => {
    expect(await streaks()).toBeUndefined();
  });
});

describe("user_category_stats", () => {
  it("matches a hand-computed count, median, best and average hints", async () => {
    const now = new Date();
    const slow = await solve(0, now, 30_000);
    await solve(1, now, 10_000);
    await solve(2, now, 20_000);
    await db.insert(attemptHints).values([
      { attemptId: slow, kind: "check_all" },
      { attemptId: slow, kind: "reveal_all" },
      { attemptId: slow, kind: "check_all" },
    ]);
    const [stats] = await db
      .select({
        solves: userCategoryStats.solves,
        medianDurationMs: userCategoryStats.medianDurationMs,
        bestDurationMs: userCategoryStats.bestDurationMs,
        avgHints: userCategoryStats.avgHints,
      })
      .from(userCategoryStats)
      .where(eq(userCategoryStats.userId, userId));
    expect(stats).toEqual({
      solves: 3,
      medianDurationMs: 20_000,
      bestDurationMs: 10_000,
      avgHints: "1.00",
    });
  });
});

describe("getCasebook", () => {
  beforeEach(() => {
    session.userId = userId;
  });

  it("throws without a session", async () => {
    session.userId = null;
    await expect(getCasebook()).rejects.toThrow("Unauthorised");
  });

  it("is empty for a user without solves", async () => {
    expect(await getCasebook()).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      categories: [],
      recent: [],
    });
  });

  it("returns streaks, category stats and the latest solves first", async () => {
    await solve(0, await londonDayOffset(-1), 5000);
    await solve(1, await londonDayOffset(0), 7000);
    const casebook = await getCasebook();
    expect(casebook.currentStreak).toBe(2);
    expect(casebook.categories.map(({ solves }) => solves)).toEqual([2]);
    expect(casebook.recent.map(({ puzzleSlug }) => puzzleSlug)).toEqual([
      "t023-1",
      "t023-0",
    ]);
  });
});
