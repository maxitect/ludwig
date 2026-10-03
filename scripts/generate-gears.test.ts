import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, like, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { gearDaily, gearPuzzleGears, gearPuzzles, puzzles } from "@/db/schema";
import { registry } from "@/puzzles/registry";
import { generateDailies, parseOptions, UsageError } from "./generate-gears";
import { generateDiagram } from "@/puzzles/gears/generate";
import { seed, upsertPuzzle } from "./seed";

const FROM = "2099-03-01";
const options = { from: FROM, days: 4, cycle: ["easy", "medium"] as const };

const cleanUp = () =>
  db.delete(puzzles).where(like(puzzles.slug, "daily-2099-%"));

const counts = async () => ({
  puzzles: (
    await db
      .select({ n: sql<number>`count(*)::int` })
      .from(puzzles)
      .where(like(puzzles.slug, "daily-2099-%"))
  )[0].n,
  gears: (
    await db
      .select({ n: sql<number>`count(*)::int` })
      .from(gearPuzzleGears)
      .innerJoin(puzzles, eq(puzzles.id, gearPuzzleGears.puzzleId))
      .where(like(puzzles.slug, "daily-2099-%"))
  )[0].n,
  daily: (
    await db
      .select({ n: sql<number>`count(*)::int` })
      .from(gearDaily)
      .where(like(sql`${gearDaily.date}::text`, "2099-%"))
  )[0].n,
});

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
  it("accepts a valid command with the default cycle", () => {
    expect(parseOptions(["--from", "2026-11-01", "--days", "7"])).toEqual({
      from: "2026-11-01",
      days: 7,
      cycle: ["easy", "medium", "hard", "expert"],
    });
  });

  it.each([
    [["--from", "2026-13-01", "--days", "7"]],
    [["--from", "2026-02-30", "--days", "7"]],
    [["--from", "2026-11-01", "--days", "0"]],
    [["--from", "2026-11-01", "--days", "2.5"]],
    [["--from", "2026-11-01"]],
    [["--days", "7"]],
    [["--from", "2026-11-01", "--days", "7", "--difficulty-cycle", "easy,nope"]],
    [["--from", "2026-11-01", "--days", "7", "--bogus"]],
  ])("rejects %j", (argv) => {
    expect(() => parseOptions(argv)).toThrow(UsageError);
  });
});

describe("generateDailies", () => {
  it("creates linked daily puzzles, idempotently, and survives db:seed", async () => {
    expect(await generateDailies(db, registry, { ...options, cycle: [...options.cycle] })).toEqual({
      created: 4,
      skipped: 0,
    });
    const first = await counts();
    expect(first.puzzles).toBe(4);
    expect(first.daily).toBe(4);

    const linked = await db
      .select({
        slug: puzzles.slug,
        date: gearDaily.date,
        seed: gearPuzzles.generatorSeed,
        publishedAt: puzzles.publishedAt,
      })
      .from(gearDaily)
      .innerJoin(puzzles, eq(puzzles.id, gearDaily.puzzleId))
      .innerJoin(gearPuzzles, eq(gearPuzzles.puzzleId, gearDaily.puzzleId))
      .where(like(puzzles.slug, "daily-2099-%"));
    for (const row of linked) {
      expect(row.slug).toBe(`daily-${row.date}`);
      expect(row.seed).toBe(row.date);
      expect(row.publishedAt?.toISOString()).toBe(`${row.date}T00:00:00.000Z`);
    }

    expect(await generateDailies(db, registry, { ...options, cycle: [...options.cycle] })).toEqual({
      created: 0,
      skipped: 4,
    });
    expect(await counts()).toEqual(first);

    await seed({ db, registry, contentDir });
    expect(await counts()).toEqual(first);
  });

  it("lets db:seed remove a daily-* puzzle that gear_daily does not link", async () => {
    await upsertPuzzle(db, registry, {
      typeKey: "gears",
      meta: { slug: "daily-2099-09-09", title: "Unlinked", difficulty: 2 },
      content: generateDiagram("2099-09-09", "easy"),
    });
    await seed({ db, registry, contentDir });
    expect(
      await db.select({ id: puzzles.id }).from(puzzles).where(eq(puzzles.slug, "daily-2099-09-09")),
    ).toEqual([]);
  });

  it("regenerates identical diagrams after the rows are dropped", async () => {
    const snapshot = async () =>
      db
        .select({
          teeth: gearPuzzleGears.teeth,
          startSlot: gearPuzzleGears.startSlot,
          initialOffset: gearPuzzleGears.initialOffset,
        })
        .from(gearPuzzleGears)
        .innerJoin(puzzles, eq(puzzles.id, gearPuzzleGears.puzzleId))
        .where(eq(puzzles.slug, "daily-2099-03-03"))
        .orderBy(gearPuzzleGears.label);
    const before = await snapshot();
    expect(before.length).toBeGreaterThanOrEqual(6);

    await cleanUp();
    await generateDailies(db, registry, { ...options, cycle: [...options.cycle] });
    expect(await snapshot()).toEqual(before);
  });
});
