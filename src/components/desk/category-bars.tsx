"use client";

import { scaleLinear } from "d3-scale";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { ChartFrame, DataTable, useIntro } from "./chart-parts";
import { plural } from "./chart-model";
import { formatDuration } from "@/utils/format-duration";

const WIDTH = 320;
const BAR = 18;

export function CategoryBars({
  categories,
  selected,
  onSelect,
}: {
  categories: DeskCharts["categories"];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const intro = useIntro<HTMLUListElement>();
  const x = scaleLinear().range([0, WIDTH - 4]);

  return (
    <ChartFrame id="chart-categories" question="Where am I strongest?">
      <ul ref={intro} className="flex flex-col gap-2">
        {categories.map(({ key, name, published, solved, medianDurationMs }) => {
          const width = x.domain([0, Math.max(published, 1)])(solved);
          const on = selected === key;
          const median =
            medianDurationMs === null ? "no time yet" : `median ${formatDuration(medianDurationMs)}`;
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${name}: ${solved} of ${published} solved, ${median}. ${on ? "Showing its types" : "Show its types"}`}
                onClick={() => onSelect(on ? null : key)}
                className="group flex w-full flex-col gap-1 border-2 border-transparent p-1 text-left hover:border-border focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary"
              >
                <span className="flex items-baseline justify-between gap-2 font-display text-sm font-bold tracking-[0.04em] uppercase">
                  <span className="flex items-center gap-1.5">
                    {on && <span aria-hidden="true" className="size-2 bg-primary" />}
                    {name}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    {solved}/{published}
                    <span className="font-light"> · {medianDurationMs === null ? "–" : formatDuration(medianDurationMs)}</span>
                  </span>
                </span>
                <svg
                  viewBox={`0 0 ${WIDTH} ${BAR}`}
                  className="h-4.5 w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    x={1}
                    y={1}
                    width={WIDTH - 2}
                    height={BAR - 2}
                    strokeWidth={2}
                    className="fill-transparent stroke-grid-blue ink:stroke-muted"
                    vectorEffect="non-scaling-stroke"
                  />
                  {solved > 0 && (
                    <rect
                      x={2}
                      y={2}
                      width={width}
                      height={BAR - 4}
                      data-grow-w={width}
                      className={on ? "fill-primary" : "fill-foreground"}
                    />
                  )}
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs font-semibold">
        Solved out of published, median time after the dot. Select a category to filter the types.
      </p>
      <DataTable
        caption="Solved out of published, by category"
        head={["Category", "Solved", "Published", "Median time"]}
        rows={categories.map(({ name, solved, published, medianDurationMs }) => [
          name,
          solved,
          plural(published, "puzzle"),
          medianDurationMs === null ? "none" : formatDuration(medianDurationMs),
        ])}
      />
    </ChartFrame>
  );
}
