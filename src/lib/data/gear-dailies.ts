import "server-only";
import { and, gte, lte } from "drizzle-orm";
import { gearDaily } from "@/db/schema";
import type { db as appDb } from "@/db";
import { generateDiagram } from "@/puzzles/gears/generate";
import { difficulties, type Difficulty } from "@/puzzles/gears/presets";
import type { PuzzleRegistry } from "@/puzzles/registry";
import { addDays, daysSinceEpoch, londonMidnight } from "@/utils/london-time";
import { contentMetaSchema, upsertPuzzle } from "./puzzle-upsert";

type Db = typeof appDb;

const TYPE_KEY = "gears";

/**
 * Generates `daily-<date>` for each of `days` dates from `from`, seeded by the date. Difficulty
 * cycles through `cycle` by date (days since 1970-01-01), so a date's difficulty does not depend on
 * which run generated it. Each puzzle is written by `upsertPuzzle`, nested in a transaction that
 * also links it in `gear_daily`. A date that already has a `gear_daily` row is skipped, so a
 * published daily never changes.
 */
export async function generateDailies(
  db: Db,
  puzzleRegistry: PuzzleRegistry,
  {
    from,
    days,
    cycle,
  }: { from: string; days: number; cycle: readonly Difficulty[] },
) {
  const contentSchema = puzzleRegistry[TYPE_KEY].schema.contentSchema;
  const through = addDays(from, days - 1);
  const existing = new Set(
    (
      await db
        .select({ date: gearDaily.date })
        .from(gearDaily)
        .where(and(gte(gearDaily.date, from), lte(gearDaily.date, through)))
    ).map((row) => row.date),
  );
  const summary = { created: 0, skipped: existing.size };

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (existing.has(date)) continue;

    const difficulty = cycle[daysSinceEpoch(date) % cycle.length];
    const slug = `daily-${date}`;
    const content = contentSchema.parse(generateDiagram(date, difficulty));
    const meta = contentMetaSchema.parse({
      slug,
      title: `Daily Diagram ${date}`,
      difficulty: difficulties.indexOf(difficulty) + 2,
      publishedAt: londonMidnight(date),
    });
    await db.transaction(async (tx) => {
      const { id } = await upsertPuzzle(tx, puzzleRegistry, {
        typeKey: TYPE_KEY,
        meta,
        content,
      });
      await tx.insert(gearDaily).values({ date, puzzleId: id });
    });
    summary.created += 1;
  }
  return summary;
}
