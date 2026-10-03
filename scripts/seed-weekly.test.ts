import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  puzzleCategories,
  puzzleTypes,
  puzzles,
  volumes,
  weeklyPuzzles,
} from "@/db/schema";
import { registry } from "@/puzzles/__fixture/registry";
import { seed } from "./seed";
import { seedWeekly } from "./seed-weekly";

const lookups = {
  categories: [{ key: "__fixture", name: "Fixture", sort: 99 }],
  types: [
    {
      key: "__fixture",
      categoryKey: "__fixture",
      name: "Fixture",
      description: "Test-only type",
      subtypeTable: "fixture_puzzles",
      sort: 99,
    },
  ],
  volumes: [
    { slug: "__fixture-volume", title: "Fixture volume", cover: "blue" as const, sort: 99 },
  ],
};

const slugs = ["w-a", "w-b", "w-c"];
const ref = (slug: string) => ({ type: "__fixture", slug });
const weekStarts = ["2026-09-28", "2026-10-05"];

async function cleanUp() {
  await db.delete(puzzles).where(eq(puzzles.typeKey, "__fixture"));
  await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "__fixture"));
  await db.delete(puzzleCategories).where(eq(puzzleCategories.key, "__fixture"));
  await db.delete(volumes).where(eq(volumes.slug, "__fixture-volume"));
}

const rows = () =>
  db
    .select({
      weekStart: weeklyPuzzles.weekStart,
      slot: weeklyPuzzles.slot,
      slug: puzzles.slug,
    })
    .from(weeklyPuzzles)
    .innerJoin(puzzles, eq(puzzles.id, weeklyPuzzles.puzzleId))
    .where(eq(puzzles.typeKey, "__fixture"))
    .orderBy(weeklyPuzzles.weekStart, weeklyPuzzles.slot);

let contentDir: string;
beforeAll(async () => {
  await cleanUp();
  contentDir = mkdtempSync(path.join(tmpdir(), "ludwig-weekly-"));
  mkdirSync(path.join(contentDir, "__fixture"));
  for (const slug of slugs) {
    writeFileSync(
      path.join(contentDir, "__fixture", `${slug}.ts`),
      `export const meta = { slug: "${slug}", title: "${slug}", difficulty: 1 };
export const content = { note: "n", items: [{ position: 0, label: "x" }] };
`,
    );
  }
  const summary = await seed({ db, registry, contentDir, lookups });
  expect(summary.failures).toEqual([]);
});
afterAll(async () => {
  await cleanUp();
  rmSync(contentDir, { recursive: true, force: true });
});

describe("seedWeekly", () => {
  it("writes two slots per week and re-seeds idempotently, including a slot swap", async () => {
    const schedule = [
      { weekStart: weekStarts[0], first: ref("w-a"), second: ref("w-b") },
      { weekStart: weekStarts[1], first: ref("w-b"), second: ref("w-a") },
    ];
    expect((await seedWeekly(db, schedule)).failures).toEqual([]);
    expect(await rows()).toHaveLength(4);

    const swapped = [
      { weekStart: weekStarts[0], first: ref("w-b"), second: ref("w-a") },
      schedule[1],
    ];
    expect((await seedWeekly(db, swapped)).failures).toEqual([]);
    expect((await rows()).filter((r) => r.weekStart === weekStarts[0])).toEqual([
      { weekStart: weekStarts[0], slot: "first", slug: "w-b" },
      { weekStart: weekStarts[0], slot: "second", slug: "w-a" },
    ]);
  });

  it("rejects a week that does not start on Monday, writing nothing", async () => {
    await db
      .delete(weeklyPuzzles)
      .where(inArray(weeklyPuzzles.weekStart, weekStarts));
    const result = await seedWeekly(db, [
      { weekStart: "2026-09-29", first: ref("w-a"), second: ref("w-b") },
    ]);
    expect(result.failures).toEqual(["weekly[0.weekStart]: must be a Monday"]);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects an unknown slug, writing nothing", async () => {
    const result = await seedWeekly(db, [
      { weekStart: weekStarts[0], first: ref("w-a"), second: ref("nope") },
    ]);
    expect(result.failures).toEqual([
      "weekly 2026-09-28 second: unknown puzzle __fixture/nope",
    ]);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects the same puzzle in both slots", async () => {
    const result = await seedWeekly(db, [
      { weekStart: weekStarts[0], first: ref("w-a"), second: ref("w-a") },
    ]);
    expect(result.failures).toHaveLength(1);
  });

  it("accepts an empty schedule", async () => {
    expect(await seedWeekly(db, [])).toEqual({ weeks: 0, failures: [] });
  });

  it("leaves puzzle rows alone", async () => {
    await seedWeekly(db, [
      { weekStart: weekStarts[0], first: ref("w-a"), second: ref("w-c") },
    ]);
    const stored = await db
      .select({ slug: puzzles.slug })
      .from(puzzles)
      .where(eq(puzzles.typeKey, "__fixture"));
    expect(stored.map((p) => p.slug).sort()).toEqual(slugs);
  });
});
