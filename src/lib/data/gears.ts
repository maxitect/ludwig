import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { isPublished } from "./puzzles";

const puzzleColumns = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
} as const;

/** Curated (unseeded) published diagrams, split into plain and Fix the Diagram. */
export async function getGearsCatalogue() {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const rows = await db.query.puzzles.findMany({
    where: {
      typeKey: "gears",
      RAW: isPublished,
      gears: { generatorSeed: { isNull: true } },
    },
    columns: puzzleColumns,
    orderBy: { difficulty: "asc", title: "asc" },
    with: { gears: { columns: { maxAdjustments: true } } },
  });
  const curated = rows.map(({ gears, ...puzzle }) => {
    if (!gears) {
      throw new Error(`Gear puzzle ${puzzle.slug} has no subtype row`);
    }
    return { ...puzzle, fix: gears.maxAdjustments > 0 };
  });
  return {
    diagrams: curated.filter(({ fix }) => !fix),
    fixes: curated.filter(({ fix }) => fix),
  };
}

/**
 * The published daily for a London calendar date, or null when none exists. `date` is a cache key,
 * so the caller reads the clock outside the cache.
 */
export async function getDailyDiagram(date: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const daily = await db.query.gearDaily.findFirst({
    where: { date },
    columns: {},
    with: { puzzle: { columns: puzzleColumns, where: { RAW: isPublished } } },
  });
  return daily?.puzzle ?? null;
}
