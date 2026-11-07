"use client";

import { scaleLinear } from "d3-scale";
import { useState } from "react";
import { HEAT_WEEKS } from "@/config/desk";
import type { DeskCharts } from "@/lib/data/desk-charts";
import {
  ChartFrame,
  DataTable,
  Tip,
  useIntro,
  useTip,
} from "./chart-parts";
import { heatCells, longDay, plural, shortMonth } from "./chart-model";

const CELL = 16;
const PITCH = 20;
const LEFT = 26;
const TOP = 18;
const WIDTH = LEFT + HEAT_WEEKS * PITCH;
const HEIGHT = TOP + 7 * PITCH;
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

const inner = scaleLinear().domain([0, 4]).range([0.35, 1]).clamp(true);

export function ActivityChart({
  charts,
  currentStreak,
}: {
  charts: DeskCharts;
  currentStreak: number;
}) {
  const cells = heatCells(charts, currentStreak);
  const [active, setActive] = useState(cells.length - 1);
  const { frame, tip, show, hide } = useTip();
  const intro = useIntro<SVGSVGElement>();
  const total = cells.reduce((sum, { solves }) => sum + solves, 0);

  const label = (cell: (typeof cells)[number]) =>
    `${longDay(cell.day)}: ${cell.solves === 0 ? "no solves" : plural(cell.solves, "solve")}${cell.inStreak ? ", in your current streak" : ""}`;

  const move = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    const step =
      { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key] ??
      0;
    if (!step) return;
    event.preventDefault();
    const next = Math.min(cells.length - 1, Math.max(0, index + step));
    setActive(next);
    const node = event.currentTarget.parentElement?.children[next];
    if (node instanceof SVGElement) node.focus();
  };

  return (
    <ChartFrame id="chart-activity" question="Have I been showing up?">
      <div ref={frame} className="relative">
        <svg
          ref={intro}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="group"
          aria-label={`Solves per day over the last ${HEAT_WEEKS} weeks: ${plural(total, "solve")}. Use the arrow keys to move between days.`}
        >
          {WEEKDAY_LABELS.map((name, row) => (
            <text
              key={row}
              x={0}
              y={TOP + row * PITCH + CELL - 3}
              className="fill-muted-foreground font-display text-[10px] font-bold uppercase"
            >
              {name}
            </text>
          ))}
          {cells
            .filter(({ row, day }) => row === 0 && day.slice(8) <= "07")
            .map(({ week, day }) => (
              <text
                key={day}
                x={LEFT + week * PITCH}
                y={11}
                className="fill-muted-foreground font-display text-[10px] font-bold uppercase"
              >
                {shortMonth(day)}
              </text>
            ))}
          <g>
            {cells.map((cell, index) => {
              const x = LEFT + cell.week * PITCH;
              const y = TOP + cell.row * PITCH;
              const size = CELL * inner(cell.solves);
              const text = label(cell);
              return (
                <g
                  key={cell.day}
                  role="img"
                  aria-label={text}
                  tabIndex={index === active ? 0 : -1}
                  onFocus={(event) => {
                    setActive(index);
                    show(event.currentTarget, text);
                  }}
                  onBlur={hide}
                  onPointerEnter={(event) => show(event.currentTarget, text)}
                  onPointerLeave={hide}
                  onKeyDown={(event) => move(event, index)}
                  className="outline-none focus-visible:[&>rect:first-child]:stroke-ring"
                >
                  <rect
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    strokeWidth={2}
                    className={
                      cell.inStreak
                        ? "fill-transparent stroke-primary"
                        : "fill-transparent stroke-grid-blue ink:stroke-muted"
                    }
                  />
                  {cell.solves > 0 && (
                    <rect
                      x={x + (CELL - size) / 2}
                      y={y + (CELL - size) / 2}
                      width={size}
                      height={size}
                      data-pop={`${x + CELL / 2},${y + CELL / 2}`}
                      className="fill-foreground"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <Tip tip={tip} />
      </div>
      <Legend />
      <DataTable
        caption="Solves per day"
        head={["Day", "Solves", "In current streak"]}
        rows={cells
          .filter(({ solves }) => solves > 0)
          .map(({ day, solves, inStreak }) => [
            day,
            solves,
            inStreak ? "yes" : "no",
          ])}
      />
    </ChartFrame>
  );
}

function Legend() {
  return (
    <ul
      aria-hidden="true"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold"
    >
      <li className="flex items-center gap-1.5">
        <span className="size-3 border-2 border-grid-blue ink:border-muted" />
        No solves
      </li>
      <li className="flex items-center gap-1.5">
        <span className="grid size-3 place-items-center border-2 border-grid-blue ink:border-muted">
          <span className="size-1 bg-foreground" />
        </span>
        <span className="grid size-3 place-items-center border-2 border-grid-blue ink:border-muted">
          <span className="size-2 bg-foreground" />
        </span>
        More solves, bigger square
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 border-2 border-primary" />
        Current streak
      </li>
    </ul>
  );
}
