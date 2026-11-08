"use client";

import { useState } from "react";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { ActivityChart } from "./activity-chart";
import { CategoryBars } from "./category-bars";
import { SpeedChart } from "./speed-chart";
import { TypeTiles } from "./type-tiles";
import { WeeklyLine } from "./weekly-line";

export default function ChartsView({
  charts,
  currentStreak,
}: {
  charts: DeskCharts;
  currentStreak: number;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const types = category
    ? charts.types.filter(({ categoryKey }) => categoryKey === category)
    : charts.types;
  const categoryName =
    charts.categories.find(({ key }) => key === category)?.name ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ActivityChart
        charts={charts}
        currentStreak={currentStreak}
      />
      <WeeklyLine charts={charts} />
      <div className="flex flex-col gap-4 lg:col-span-2 lg:grid lg:grid-cols-[2fr_3fr]">
        <CategoryBars
          categories={charts.categories}
          selected={category}
          onSelect={setCategory}
        />
        <TypeTiles types={types} categoryName={categoryName} />
      </div>
      <div className="lg:col-span-2">
        <SpeedChart difficulties={charts.difficulties} />
      </div>
    </div>
  );
}
