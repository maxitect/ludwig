import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { db as appDb } from "../src/db";
import { puzzles, weeklyPuzzles } from "../src/db/schema";
import { weeklyPuzzleInsertSchema } from "../src/db/schema/core";
import { isMonday } from "../src/utils/london-time";

type Db = typeof appDb;

const puzzleRefSchema = z.object({ type: z.string(), slug: z.string() });

export const weeklyScheduleSchema = z.array(
  weeklyPuzzleInsertSchema
    .pick({ weekStart: true })
    .extend({ first: puzzleRefSchema, second: puzzleRefSchema })
    .refine(({ weekStart }) => isMonday(weekStart), {
      path: ["weekStart"],
      message: "must be a Monday",
    })
    .refine(
      ({ first, second }) =>
        first.type !== second.type || first.slug !== second.slug,
      { path: ["second"], message: "must differ from the first puzzle" },
    ),
);

export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;

/**
 * Validates the schedule, resolves each `(type, slug)` to a puzzle id and rewrites the
 * `weekly_puzzles` rows of the weeks listed, in one transaction. Nothing is written when any
 * entry is invalid. Puzzle rows are never touched.
 */
export async function seedWeekly(db: Db, schedule: unknown) {
  const parsed = weeklyScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    return {
      weeks: 0,
      failures: parsed.error.issues.map(
        (issue) => `weekly[${issue.path.join(".")}]: ${issue.message}`,
      ),
    };
  }

  const slugs = [
    ...new Set(parsed.data.flatMap(({ first, second }) => [first.slug, second.slug])),
  ];
  const rows = slugs.length
    ? await db
        .select({ id: puzzles.id, typeKey: puzzles.typeKey, slug: puzzles.slug })
        .from(puzzles)
        .where(inArray(puzzles.slug, slugs))
    : [];
  const ids = new Map(rows.map((row) => [`${row.typeKey}/${row.slug}`, row.id]));

  const failures: string[] = [];
  const values = parsed.data.flatMap(({ weekStart, first, second }) =>
    (
      [
        ["first", first],
        ["second", second],
      ] as const
    ).flatMap(([slot, { type, slug }]) => {
      const puzzleId = ids.get(`${type}/${slug}`);
      if (!puzzleId) {
        failures.push(`weekly ${weekStart} ${slot}: unknown puzzle ${type}/${slug}`);
        return [];
      }
      return [{ weekStart, slot, puzzleId }];
    }),
  );
  if (failures.length) return { weeks: 0, failures };

  const weekStarts = parsed.data.map(({ weekStart }) => weekStart);
  await db.transaction(async (tx) => {
    await tx
      .delete(weeklyPuzzles)
      .where(inArray(weeklyPuzzles.weekStart, weekStarts));
    await tx.insert(weeklyPuzzles).values(values);
  });
  return { weeks: weekStarts.length, failures };
}
