import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { db as appDb } from "@/db";
import { dailyPuzzles } from "@/db/schema";
import {
  difficulties,
  type Difficulty,
} from "@/puzzles/_shared/generate/pipeline";
import { generators, regenerate } from "@/puzzles/generators";
import type { PuzzleRegistry } from "@/puzzles/registry";
import { addDays, daysSinceEpoch, londonMidnight } from "@/utils/london-time";
import { contentMetaSchema, upsertPuzzle } from "./puzzle-upsert";

type Db = typeof appDb;

export const dailySlug = (typeKey: string, date: string) =>
  `daily-${typeKey}-${date}`;

/** A date's difficulty depends only on the date, so it does not depend on which run generated it. */
export const dailyDifficulty = (date: string): Difficulty =>
  difficulties[daysSinceEpoch(date) % difficulties.length];

/** The generator of a type's dailies is the one registered under its type key, at its newest version. */
export function latestVersion(typeKey: string) {
  const versions = Object.hasOwn(generators, typeKey)
    ? Object.keys(generators[typeKey]).map(Number)
    : [];
  if (!versions.length) {
    throw new Error(`No generator registered for ${typeKey}`);
  }
  return Math.max(...versions);
}

/**
 * Generates `daily-<type>-<date>` for each of `days` dates from `from`, seeded by the date, at the
 * generator's newest version. Each puzzle is written by `upsertPuzzle`, nested in a transaction
 * that also inserts its `daily_puzzles` row. A date that already has a row is skipped, so a
 * published daily never changes. The transaction holds an advisory lock on the (type, date) and
 * re-checks it, so overlapping runs skip each other's dates instead of failing.
 */
export async function generateDailies(
  db: Db,
  puzzleRegistry: PuzzleRegistry,
  { typeKey, from, days }: { typeKey: string; from: string; days: number },
) {
  const contentSchema = puzzleRegistry[typeKey].schema.contentSchema;
  const version = latestVersion(typeKey);
  const through = addDays(from, days - 1);
  const existing = new Set(
    (
      await db
        .select({ date: dailyPuzzles.date })
        .from(dailyPuzzles)
        .where(
          and(
            eq(dailyPuzzles.typeKey, typeKey),
            gte(dailyPuzzles.date, from),
            lte(dailyPuzzles.date, through),
          ),
        )
    ).map((row) => row.date),
  );
  const summary = { created: 0, skipped: existing.size };

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (existing.has(date)) continue;

    const difficulty = dailyDifficulty(date);
    const { content } = regenerate(
      { generator: typeKey, version, seed: date },
      difficulty,
    );
    const meta = contentMetaSchema.parse({
      slug: dailySlug(typeKey, date),
      title: `Daily ${date}`,
      difficulty,
      publishedAt: londonMidnight(date),
    });
    const created = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`daily_puzzles:${typeKey}:${date}`}))`,
      );
      const [taken] = await tx
        .select({ date: dailyPuzzles.date })
        .from(dailyPuzzles)
        .where(and(eq(dailyPuzzles.typeKey, typeKey), eq(dailyPuzzles.date, date)));
      if (taken) return false;
      const { id } = await upsertPuzzle(tx, puzzleRegistry, {
        typeKey,
        meta,
        content: contentSchema.parse(content),
      });
      await tx
        .insert(dailyPuzzles)
        .values({ typeKey, date, puzzleId: id, generatorVersion: version });
      return true;
    });
    summary[created ? "created" : "skipped"] += 1;
  }
  return summary;
}
