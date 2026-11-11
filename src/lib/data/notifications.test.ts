import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import {
  attempts,
  dailyPuzzles,
  puzzles,
  troixPuzzles,
  user,
  userFavouriteTypes,
  userSettings,
} from "@/db/schema";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import { addDays, londonDate, londonMidnight } from "@/utils/london-time";
import {
  selectFavouriteDigests,
  selectStreakNudges,
} from "./notifications";

vi.mock("server-only", () => ({}));
const sendEmail = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/email/send", () => ({ sendEmail }));

const { runFavouriteDigest, runStreakNudge } = await import(
  "@/lib/email/dispatch"
);

const PREFIX = "zz-notify-";
const HOUR = 3_600_000;
const now = new Date();
const today = londonDate(now);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * HOUR);
const baseUrl = "http://localhost:3000";
let counter = 0;

async function addPuzzle(publishedAt: Date | null, daily = false) {
  const slug = `${PREFIX}${Date.now()}-${counter++}`;
  return db.transaction(async (tx) => {
    const [puzzle] = await tx
      .insert(puzzles)
      .values({
        typeKey: "troix",
        slug,
        title: `Title ${slug}`,
        difficulty: 1,
        publishedAt,
      })
      .returning({ id: puzzles.id, slug: puzzles.slug });
    await tx.insert(troixPuzzles).values({ puzzleId: puzzle.id, size: 6 });
    if (daily) {
      await tx.insert(dailyPuzzles).values({
        typeKey: "troix",
        date: addDays("2100-01-01", counter),
        puzzleId: puzzle.id,
        generatorVersion: 1,
      });
    }
    return puzzle;
  });
}

async function addUser(
  tag: string,
  settings: Partial<typeof userSettings.$inferInsert> = {},
) {
  const userId = await createTestUser(tag);
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId));
  await db.insert(userSettings).values({ userId, ...settings });
  return userId;
}

/** One completed attempt on each London day, `daysBack` days before today. */
async function solveOn(userId: string, daysBack: number[]) {
  for (const back of daysBack) {
    const puzzle = await addPuzzle(hoursAgo(24 * 30));
    const completedAt = new Date(
      londonMidnight(addDays(today, -back)).getTime() + 12 * HOUR,
    );
    await db.insert(attempts).values({
      userId,
      puzzleId: puzzle.id,
      startedAt: completedAt,
      completedAt,
      durationMs: 60_000,
    });
  }
}

const idsOf = (rows: { userId: string }[], ids: string[]) =>
  rows.map((row) => row.userId).filter((id) => ids.includes(id));

afterAll(async () => {
  await db.delete(puzzles).where(like(puzzles.slug, `${PREFIX}%`));
  await deleteTestUsers();
});

describe("favourite digest selection", () => {
  let a: string;
  let b: string;
  let off: string;
  let doneToday: string;
  let milestone: string;
  let milestoneSolvedToday: string;
  let fresh: { id: string; slug: string };
  const all: string[] = [];

  beforeAll(async () => {
    const cursor = hoursAgo(48);
    const opted = { notifyFavourites: true, favouritesDigestAt: cursor };
    a = await addUser("dig-a", opted);
    b = await addUser("dig-b", opted);
    off = await addUser("dig-off", { favouritesDigestAt: cursor });
    doneToday = await addUser("dig-done", {
      notifyFavourites: true,
      favouritesDigestAt: now,
    });
    milestone = await addUser("dig-ms", opted);
    milestoneSolvedToday = await addUser("dig-ms-today", opted);
    all.push(a, b, off, doneToday, milestone, milestoneSolvedToday);
    for (const id of [a, off, doneToday]) {
      await db.insert(userFavouriteTypes).values({ userId: id, typeKey: "troix" });
    }
    await db.insert(userFavouriteTypes).values({ userId: b, typeKey: "sudoku" });
    await solveOn(milestone, [1, 2, 3, 4, 5, 6, 7]);
    await solveOn(milestoneSolvedToday, [0, 1, 2, 3, 4, 5, 6, 7]);
    fresh = await addPuzzle(hoursAgo(24));
    await addPuzzle(hoursAgo(24), true);
    await addPuzzle(hoursAgo(72));
    await addPuzzle(new Date(now.getTime() + 24 * HOUR));
    await addPuzzle(null);
  });

  it("lists only the new curated puzzles of a favourite type for the opted-in user", async () => {
    const rows = await selectFavouriteDigests(now);
    expect(idsOf(rows, all).sort()).toEqual(
      [a, b, milestone, milestoneSolvedToday].sort(),
    );
    expect(rows.find((row) => row.userId === a)?.puzzles.map((p) => p.slug)).toEqual(
      [fresh.slug],
    );
    expect(rows.find((row) => row.userId === b)?.puzzles).toEqual([]);
  });

  it("notes a streak milestone reached yesterday", async () => {
    const rows = await selectFavouriteDigests(now);
    expect(rows.find((row) => row.userId === milestone)?.milestoneDays).toBe(7);
    expect(
      rows.find((row) => row.userId === milestoneSolvedToday)?.milestoneDays,
    ).toBe(7);
    expect(rows.find((row) => row.userId === a)?.milestoneDays).toBeNull();
  });

  it("sends one email to users with something to say and selects nobody on a second run", async () => {
    sendEmail.mockClear();
    const first = await runFavouriteDigest(baseUrl, now);
    expect(first.failed).toBe(0);
    expect(first.sent).toBe(3);
    expect(sendEmail).toHaveBeenCalledTimes(3);
    sendEmail.mockClear();
    const second = await runFavouriteDigest(baseUrl, now);
    expect(second).toEqual({ eligible: 0, sent: 0, failed: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(idsOf(await selectFavouriteDigests(now), all)).toEqual([]);
  });
});

describe("streak nudge selection", () => {
  const all: string[] = [];
  let one: string;
  let solvedToday: string;
  let atRisk: string;
  let off: string;

  beforeAll(async () => {
    const on = { notifyStreak: true };
    one = await addUser("nud-one", on);
    solvedToday = await addUser("nud-today", on);
    atRisk = await addUser("nud-risk", on);
    off = await addUser("nud-off");
    all.push(one, solvedToday, atRisk, off);
    await solveOn(one, [1]);
    await solveOn(solvedToday, [0, 1, 2]);
    await solveOn(atRisk, [1, 2, 3, 4]);
    await solveOn(off, [1, 2, 3]);
  });

  it("selects only an opted-in player with a streak of 2 or more and no solve today", async () => {
    const rows = await selectStreakNudges(now);
    expect(idsOf(rows, all)).toEqual([atRisk]);
    expect(rows.find((row) => row.userId === atRisk)?.streak).toBe(4);
  });

  it("sends once, never twice in a day, and stops after a solve today", async () => {
    sendEmail.mockClear();
    expect(await runStreakNudge(baseUrl, now)).toEqual({
      eligible: 1,
      sent: 1,
      failed: 0,
    });
    expect(await runStreakNudge(baseUrl, now)).toEqual({
      eligible: 0,
      sent: 0,
      failed: 0,
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    await db
      .update(userSettings)
      .set({ nudgeSentAt: null })
      .where(inArray(userSettings.userId, [atRisk]));
    await solveOn(atRisk, [0]);
    expect(idsOf(await selectStreakNudges(now), all)).toEqual([]);
  });
});
