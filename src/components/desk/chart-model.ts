import { HEAT_WEEKS } from "@/config/desk";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { addDays, daysSinceEpoch } from "@/utils/london-time";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "short",
});

export const longDay = (day: string) =>
  dayFormat.format(new Date(`${day}T00:00:00Z`));
export const shortMonth = (day: string) =>
  monthFormat.format(new Date(`${day}T00:00:00Z`));
export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export type HeatCell = {
  day: string;
  week: number;
  row: number;
  solves: number;
  inStreak: boolean;
};

/** One cell per London day from the first Monday on screen up to today; days after today are not drawn. */
export function heatCells(charts: DeskCharts, currentStreak: number): HeatCell[] {
  const solves = new Map(charts.days.map(({ day, solves }) => [day, solves]));
  const lastDay = charts.days.at(-1)?.day;
  const streakStart =
    currentStreak > 0 && lastDay !== undefined
      ? daysSinceEpoch(addDays(lastDay, 1 - currentStreak))
      : undefined;
  const streakEnd = lastDay === undefined ? undefined : daysSinceEpoch(lastDay);

  return Array.from({ length: HEAT_WEEKS * 7 }, (_, index) => {
    const day = addDays(charts.heatStart, index);
    const epoch = daysSinceEpoch(day);
    return {
      day,
      week: Math.floor(index / 7),
      row: index % 7,
      solves: solves.get(day) ?? 0,
      inStreak:
        streakStart !== undefined &&
        streakEnd !== undefined &&
        epoch >= streakStart &&
        epoch <= streakEnd,
    };
  }).filter(({ day }) => day <= charts.today);
}

export type WeekPoint = { week: string; solves: number; total: number };

/** Cumulative solves at the end of each of the last weeks, starting from everything solved before the first. */
export function cumulativeWeeks(charts: DeskCharts): WeekPoint[] {
  const bySolves = new Map(
    charts.weeks.map(({ week, solves }) => [week, solves]),
  );
  let total = charts.weeks
    .filter(({ week }) => week < charts.heatStart)
    .reduce((sum, { solves }) => sum + solves, 0);
  return Array.from({ length: HEAT_WEEKS }, (_, index) => {
    const week = addDays(charts.heatStart, index * 7);
    const solves = bySolves.get(week) ?? 0;
    total += solves;
    return { week, solves, total };
  });
}
