import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attempts,
  circle9Puzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  troixPuzzles,
  userTypeActivity,
} from "@/db/schema";

const DAY = 86_400_000;
let userId: string;
let otherUserId: string;
let puzzleIds: Record<string, string>;

const removePuzzles = () =>
  db.delete(puzzles).where(sql`${puzzles.slug} like 't161-%'`);

async function makePuzzle(slug: string, typeKey: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(puzzles)
      .values({ typeKey, slug, title: slug, difficulty: 1 })
      .returning({ id: puzzles.id });
    if (typeKey === "circle9") {
      await tx.insert(circle9Puzzles).values({ puzzleId: row.id });
    } else {
      await tx.insert(troixPuzzles).values({ puzzleId: row.id, size: 6 });
    }
    return row.id;
  });
}

function attempt(
  who: string,
  slug: string,
  startedAt: string,
  { completedAt, savedAt }: { completedAt?: string; savedAt?: string } = {},
) {
  const started = new Date(startedAt);
  const completed = completedAt ? new Date(completedAt) : null;
  return db.insert(attempts).values({
    userId: who,
    puzzleId: puzzleIds[slug],
    startedAt: started,
    completedAt: completed,
    durationMs: completed ? completed.getTime() - started.getTime() : null,
    lastSavedAt: new Date(savedAt ?? completedAt ?? startedAt),
  });
}

const activityOf = async (who: string, typeKey: string) =>
  (
    await db
      .select({
        firstDay: userTypeActivity.firstDay,
        lastDay: userTypeActivity.lastDay,
        activeDays: userTypeActivity.activeDays,
        started: userTypeActivity.started,
        completed: userTypeActivity.completed,
        unfinished: userTypeActivity.unfinished,
        staleUnfinished: userTypeActivity.staleUnfinished,
        returnsAfterSolve: userTypeActivity.returnsAfterSolve,
      })
      .from(userTypeActivity)
      .where(
        and(
          eq(userTypeActivity.userId, who),
          eq(userTypeActivity.typeKey, typeKey),
        ),
      )
  )[0];

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: "__t161", name: "T161", sort: 97 })
    .onConflictDoNothing();
  await db
    .insert(puzzleTypes)
    .values(
      ["circle9", "troix"].map((key, index) => ({
        key,
        categoryKey: "__t161",
        name: key,
        description: "Test-only lookup",
        subtypeTable: `${key}_puzzles`,
        sort: 97 + index,
      })),
    )
    .onConflictDoNothing();
  await removePuzzles();
  puzzleIds = {
    "t161-a1": await makePuzzle("t161-a1", "circle9"),
    "t161-a2": await makePuzzle("t161-a2", "circle9"),
    "t161-a3": await makePuzzle("t161-a3", "circle9"),
    "t161-a4": await makePuzzle("t161-a4", "circle9"),
    "t161-s1": await makePuzzle("t161-s1", "troix"),
  };
  userId = await createTestUser("t161");
  otherUserId = await createTestUser("t161b");
});

afterAll(async () => {
  await removePuzzles();
  await deleteTestUsers();
});

beforeEach(async () => {
  await db.delete(attempts).where(eq(attempts.userId, userId));
  await db.delete(attempts).where(eq(attempts.userId, otherUserId));
});

describe("user_type_activity", () => {
  it("counts started, completed and unfinished attempts per type and ignores other users", async () => {
    await attempt(userId, "t161-a1", "2025-03-01T10:00:00Z", {
      completedAt: "2025-03-01T10:05:00Z",
    });
    await attempt(userId, "t161-a2", "2025-03-01T11:00:00Z");
    await attempt(userId, "t161-s1", "2025-03-01T12:00:00Z");
    await attempt(otherUserId, "t161-a3", "2025-03-01T12:00:00Z");
    expect(await activityOf(userId, "circle9")).toMatchObject({
      started: 2,
      completed: 1,
      unfinished: 1,
    });
    expect(await activityOf(userId, "troix")).toMatchObject({
      started: 1,
      completed: 0,
      unfinished: 1,
    });
  });

  it("counts distinct London days from start, save and completion, first and last day included", async () => {
    await attempt(userId, "t161-a1", "2025-07-01T10:00:00Z", {
      completedAt: "2025-07-01T23:30:00Z",
    });
    await attempt(userId, "t161-a2", "2025-07-05T09:00:00Z", {
      savedAt: "2025-07-06T09:00:00Z",
    });
    expect(await activityOf(userId, "circle9")).toMatchObject({
      firstDay: "2025-07-01",
      lastDay: "2025-07-06",
      activeDays: 4,
    });
  });

  it("flags an unfinished attempt untouched for over 7 days", async () => {
    const now = Date.now();
    await attempt(userId, "t161-a1", new Date(now - 10 * DAY).toISOString());
    await attempt(userId, "t161-a2", new Date(now - 10 * DAY).toISOString(), {
      savedAt: new Date(now - 2 * DAY).toISOString(),
    });
    expect(await activityOf(userId, "circle9")).toMatchObject({
      unfinished: 2,
      staleUnfinished: 1,
    });
  });

  it("counts an attempt started after an earlier solve of the same type as a return", async () => {
    await attempt(userId, "t161-a1", "2025-03-01T10:00:00Z", {
      completedAt: "2025-03-01T10:05:00Z",
    });
    await attempt(userId, "t161-a2", "2025-03-02T10:00:00Z", {
      completedAt: "2025-03-02T10:05:00Z",
    });
    await attempt(userId, "t161-a3", "2025-03-03T10:00:00Z");
    await attempt(userId, "t161-s1", "2025-03-03T11:00:00Z");
    expect((await activityOf(userId, "circle9"))?.returnsAfterSolve).toBe(2);
    expect((await activityOf(userId, "troix"))?.returnsAfterSolve).toBe(0);
  });
});
