import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { dailyPuzzles, puzzles } from "@/db/schema";
import { dailyDifficulty, generateDailies } from "@/lib/data/daily-puzzles";
import { registry } from "@/puzzles/registry";
import { londonMidnight } from "@/utils/london-time";
import { parseOptions, UsageError } from "./generate-daily";
import { seed } from "./seed";
import { verifyDailyRows } from "./verify-puzzles";

const options = { typeKey: "sudoku", from: "2099-03-01", days: 3 };

const cleanUp = () =>
  db.delete(puzzles).where(like(puzzles.slug, "daily-%-2099-%"));

const rows = () =>
  db
    .select({
      date: dailyPuzzles.date,
      slug: puzzles.slug,
      version: dailyPuzzles.generatorVersion,
      publishedAt: puzzles.publishedAt,
      difficulty: puzzles.difficulty,
      volumeId: puzzles.volumeId,
    })
    .from(dailyPuzzles)
    .innerJoin(puzzles, eq(puzzles.id, dailyPuzzles.puzzleId))
    .where(like(puzzles.slug, "daily-sudoku-2099-%"))
    .orderBy(dailyPuzzles.date);

const contentDir = mkdtempSync(path.join(tmpdir(), "ludwig-empty-content-"));
beforeAll(async () => {
  await seed({ db, registry, contentDir });
  await cleanUp();
});
afterAll(async () => {
  await cleanUp();
  rmSync(contentDir, { recursive: true, force: true });
});

describe("parseOptions", () => {
  it("accepts a valid command", () => {
    expect(
      parseOptions(["--type", "sudoku", "--from", "2026-11-01", "--days", "7"]),
    ).toEqual({ typeKey: "sudoku", from: "2026-11-01", days: 7 });
  });

  it.each([
    [["--from", "2026-11-01", "--days", "7"]],
    [["--type", "nope", "--from", "2026-11-01", "--days", "7"]],
    [["--type", "sudoku", "--from", "2026-02-30", "--days", "7"]],
    [["--type", "sudoku", "--from", "2026-11-01", "--days", "0"]],
    [["--type", "sudoku", "--from", "2026-11-01", "--days", "367"]],
    [["--type", "sudoku", "--from", "2026-11-01", "--days", "7", "--bogus"]],
  ])("rejects %j", (argv) => {
    expect(() => parseOptions(argv)).toThrow(UsageError);
  });
});

describe("generateDailies", () => {
  it("writes each date once, hides the future, survives db:seed and regenerates", async () => {
    expect(await generateDailies(db, registry, options)).toEqual({
      created: 3,
      skipped: 0,
    });
    const first = await rows();
    expect(first.map((row) => row.slug)).toEqual([
      "daily-sudoku-2099-03-01",
      "daily-sudoku-2099-03-02",
      "daily-sudoku-2099-03-03",
    ]);
    for (const row of first) {
      expect(row.version).toBe(1);
      expect(row.volumeId).toBeNull();
      expect(row.difficulty).toBe(dailyDifficulty(row.date));
      expect(row.publishedAt).toEqual(londonMidnight(row.date));
      expect(row.publishedAt!.getTime()).toBeGreaterThan(Date.now());
    }

    expect(await generateDailies(db, registry, options)).toEqual({
      created: 0,
      skipped: 3,
    });
    expect(await rows()).toEqual(first);

    await seed({ db, registry, contentDir });
    expect(await rows()).toEqual(first);

    const mine = (await verifyDailyRows()).failures.filter(({ slug }) =>
      slug.includes("2099-"),
    );
    expect(mine).toEqual([]);
  });

  it.each(["troix", "kakuro"])("regenerates a %s daily from its seed", async (typeKey) => {
    const daily = { typeKey, from: "2099-05-01", days: 2 };
    expect(await generateDailies(db, registry, daily)).toEqual({ created: 2, skipped: 0 });
    const mine = (await verifyDailyRows()).failures.filter(({ slug }) =>
      slug.startsWith(`daily-${typeKey}-2099-`),
    );
    expect(mine).toEqual([]);
  }, 60_000);

  it("starts no date after the deadline, and a later run writes what is left", async () => {
    const budgeted = { typeKey: "sudoku", from: "2099-06-01", days: 2 };
    expect(
      await generateDailies(db, registry, { ...budgeted, deadline: Date.now() }),
    ).toEqual({ created: 0, skipped: 0 });
    expect(await generateDailies(db, registry, budgeted)).toEqual({ created: 2, skipped: 0 });
  });

  it("lets overlapping runs skip each other's dates", async () => {
    const overlap = { typeKey: "sudoku", from: "2099-04-01", days: 4 };
    const summaries = await Promise.all([
      generateDailies(db, registry, overlap),
      generateDailies(db, registry, overlap),
    ]);
    expect(summaries[0].created + summaries[1].created).toBe(4);
    expect(summaries.map(({ created, skipped }) => created + skipped)).toEqual([4, 4]);
  });
});
