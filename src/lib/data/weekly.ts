import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { isPublished } from "./puzzles";

/** Weeks up to and including `currentWeekStart`, newest first, with only published puzzles. */
export async function getWeeklySchedule(currentWeekStart: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const rows = await db.query.weeklyPuzzles.findMany({
    where: { weekStart: { lte: currentWeekStart } },
    orderBy: { weekStart: "desc", slot: "asc" },
    columns: { weekStart: true },
    with: {
      puzzle: {
        columns: {
          id: true,
          typeKey: true,
          slug: true,
          title: true,
          difficulty: true,
        },
        where: { RAW: isPublished },
        with: { type: { columns: { name: true } } },
      },
    },
  });
  const weeks = new Map<
    string,
    NonNullable<(typeof rows)[number]["puzzle"]>[]
  >();
  for (const { weekStart, puzzle } of rows) {
    if (!puzzle) continue;
    weeks.set(weekStart, [...(weeks.get(weekStart) ?? []), puzzle]);
  }
  return [...weeks].map(([weekStart, puzzles]) => ({ weekStart, puzzles }));
}
