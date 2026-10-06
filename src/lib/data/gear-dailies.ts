import "server-only";
import { eq } from "drizzle-orm";
import { gearDaily } from "@/db/schema";
import type { db as appDb } from "@/db";
import { generateDiagram } from "@/puzzles/gears/generate";
import { difficulties, type Difficulty } from "@/puzzles/gears/presets";
import type { PuzzleRegistry } from "@/puzzles/registry";
import { londonMidnight } from "@/utils/london-time";
import { contentMetaSchema } from "../../../scripts/content-files";
import { upsertPuzzle } from "../../../scripts/seed";

type Db = typeof appDb;

const TYPE_KEY = "gears";

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/**
 * Generates `daily-<date>` for each of `days` dates from `from`, seeded by the date and cycling
 * through `cycle`. Each puzzle is written by the seed module's per-puzzle transaction, nested in one
 * that also links it in `gear_daily`. A date that already has a `gear_daily` row is skipped, so a
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
  const summary = { created: 0, skipped: 0 };

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const [existing] = await db
      .select({ date: gearDaily.date })
      .from(gearDaily)
      .where(eq(gearDaily.date, date));
    if (existing) {
      summary.skipped += 1;
      continue;
    }

    const difficulty = cycle[i % cycle.length];
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
