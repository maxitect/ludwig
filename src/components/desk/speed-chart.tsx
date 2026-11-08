"use client";

import { max } from "d3-array";
import { scaleSqrt } from "d3-scale";
import { Badge } from "@/components/ui/badge";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { formatDuration } from "@/utils/format-duration";
import { ChartFrame, DataTable, Tip, useIntro, useTip } from "./chart-parts";
import { plural } from "./chart-model";

const LEVELS = [1, 2, 3, 4, 5] as const;
const BOX = 100;

export function SpeedChart({
  difficulties,
}: {
  difficulties: DeskCharts["difficulties"];
}) {
  const byLevel = new Map(difficulties.map((row) => [row.difficulty, row]));
  const slowest = max(difficulties, ({ medianDurationMs }) => medianDurationMs) ?? 1;
  const side = scaleSqrt().domain([0, slowest]).range([6, BOX - 2]);
  const intro = useIntro<HTMLUListElement>();
  const { frame, tip, show, hide } = useTip<HTMLDivElement>();

  return (
    <ChartFrame id="chart-speed" question="How much does hard cost me?">
      <div ref={frame} className="relative">
        <ul ref={intro} className="grid grid-cols-5 items-end gap-2">
          {LEVELS.map((level) => {
            const row = byLevel.get(level);
            const text = row
              ? `Difficulty ${level}: median ${formatDuration(row.medianDurationMs)} over ${plural(row.solves, "solve")}`
              : `Difficulty ${level}: no solves yet`;
            const s = row ? side(row.medianDurationMs) : 0;
            return (
              <li key={level}>
                <div
                  tabIndex={0}
                  role="img"
                  aria-label={text}
                  onFocus={(event) => show(event.currentTarget, text)}
                  onBlur={hide}
                  onPointerEnter={(event) => show(event.currentTarget, text)}
                  onPointerLeave={hide}
                  className="flex flex-col items-center gap-1 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                <span className="font-display text-sm font-bold">
                  {row ? formatDuration(row.medianDurationMs) : "–"}
                </span>
                <svg viewBox={`0 0 ${BOX} ${BOX}`} className="h-32 w-full" aria-hidden="true">
                  {row ? (
                    <rect
                      x={(BOX - s) / 2}
                      y={BOX - s}
                      width={s}
                      height={s}
                      data-grow-h={s}
                      className="fill-foreground"
                    />
                  ) : (
                    <rect
                      x={(BOX - 6) / 2}
                      y={BOX - 6}
                      width={6}
                      height={6}
                      className="fill-grid-blue ink:fill-muted"
                    />
                  )}
                  <line
                    x1={0}
                    x2={BOX}
                    y1={BOX - 0.5}
                    y2={BOX - 0.5}
                    strokeWidth={1}
                    className="stroke-grid-blue ink:stroke-muted"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <Badge variant="difficulty" level={level} className="max-sm:scale-75" />
                </div>
              </li>
            );
          })}
        </ul>
        <Tip tip={tip} />
      </div>
      <p className="text-xs font-semibold">
        Median solve time at each difficulty; a square&apos;s area is the time. Small dots are levels you haven&apos;t solved yet.
      </p>
      <DataTable
        caption="Median solve time by difficulty"
        head={["Difficulty", "Solves", "Median time"]}
        rows={LEVELS.map((level) => {
          const row = byLevel.get(level);
          return [
            `${level} of 5`,
            row?.solves ?? 0,
            row ? formatDuration(row.medianDurationMs) : "none",
          ];
        })}
      />
    </ChartFrame>
  );
}
