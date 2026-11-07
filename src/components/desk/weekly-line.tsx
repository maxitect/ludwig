"use client";

import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { curveStepAfter, line } from "d3-shape";
import { useState } from "react";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { ChartFrame, DataTable, Tip, useIntro, useTip } from "./chart-parts";
import { cumulativeWeeks, longDay, plural } from "./chart-model";

const WIDTH = 560;
const HEIGHT = 200;
const PAD = { top: 12, right: 12, bottom: 34, left: 34 };

export function WeeklyLine({ charts }: { charts: DeskCharts }) {
  const points = cumulativeWeeks(charts);
  const pairWeeks = new Set(charts.pairWeeks);
  const [index, setIndex] = useState<number | null>(null);
  const { frame, tip, show, hide } = useTip();
  const intro = useIntro<SVGSVGElement>();

  const x = scaleLinear()
    .domain([0, points.length - 1])
    .range([PAD.left, WIDTH - PAD.right]);
  const top = max(points, ({ total }) => total) ?? 1;
  const y = scaleLinear()
    .domain([0, Math.max(top, 4)])
    .nice(4)
    .range([HEIGHT - PAD.bottom, PAD.top]);
  const path = line<(typeof points)[number]>()
    .x((_, i) => x(i))
    .y(({ total }) => y(total))
    .curve(curveStepAfter)(points);

  const describe = (i: number) => {
    const point = points[i];
    return `Week of ${longDay(point.week)}: ${plural(point.total, "solve")} so far, ${point.solves} this week${pairWeeks.has(point.week) ? ", both weekly puzzles solved" : ""}`;
  };
  const point = (i: number | null, target: Element) => {
    if (i === null) {
      setIndex(null);
      hide();
      return;
    }
    setIndex(i);
    const box = frame.current?.getBoundingClientRect();
    const svg = target.closest("svg")?.getBoundingClientRect();
    if (!box || !svg) return;
    show(target, describe(i), {
      x: svg.left - box.left + (x(i) / WIDTH) * svg.width,
      y: svg.top - box.top + (y(points[i].total) / HEIGHT) * svg.height - 8,
    });
  };
  const nearest = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const local = ((event.clientX - rect.left) / rect.width) * WIDTH;
    return Math.round(
      Math.min(points.length - 1, Math.max(0, x.invert(local))),
    );
  };

  return (
    <ChartFrame id="chart-weekly" question="Am I solving more over time?">
      <div ref={frame} className="relative">
        <svg
          ref={intro}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
          role="group"
          tabIndex={0}
          aria-label="Cumulative solves by week. Use the left and right arrow keys to read each week."
          onFocus={(event) => point(index ?? points.length - 1, event.currentTarget)}
          onBlur={() => point(null, document.body)}
          onKeyDown={(event) => {
            const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const next = Math.min(
              points.length - 1,
              Math.max(0, (index ?? points.length - 1) + step),
            );
            point(next, event.currentTarget);
          }}
        >
          {y.ticks(4).map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                strokeWidth={1}
                className="stroke-grid-blue ink:stroke-muted"
              />
              <text
                x={PAD.left - 6}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-muted-foreground font-display text-[10px] font-bold"
              >
                {tick}
              </text>
            </g>
          ))}
          <path
            d={path ?? undefined}
            data-draw
            fill="none"
            strokeWidth={3}
            strokeLinejoin="miter"
            className="stroke-foreground"
          />
          {points.map((p, i) =>
            pairWeeks.has(p.week) ? (
              <rect
                key={p.week}
                x={x(i) - 5}
                y={HEIGHT - PAD.bottom + 8}
                width={10}
                height={10}
                data-pop={`${x(i)},${HEIGHT - PAD.bottom + 13}`}
                className="fill-primary"
              />
            ) : null,
          )}
          {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 4}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground font-display text-[10px] font-bold uppercase"
            >
              {longDay(points[i].week).replace(/^\w+ /, "")}
            </text>
          ))}
          {index !== null && (
            <g aria-hidden="true">
              <line
                x1={x(index)}
                x2={x(index)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                strokeWidth={2}
                className="stroke-primary"
              />
              <rect
                x={x(index) - 5}
                y={y(points[index].total) - 5}
                width={10}
                height={10}
                strokeWidth={2}
                className="fill-primary stroke-card"
              />
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={WIDTH - PAD.left - PAD.right}
            height={HEIGHT - PAD.top - PAD.bottom}
            fill="transparent"
            onPointerMove={(event) => point(nearest(event), event.currentTarget)}
            onPointerLeave={() => point(null, document.body)}
          />
        </svg>
        <Tip tip={tip} />
      </div>
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <span aria-hidden="true" className="size-2.5 bg-primary" />
        Both weekly puzzles solved that week
      </p>
      <DataTable
        caption="Cumulative solves by week"
        head={["Week starting", "Solved that week", "Total so far", "Both weekly puzzles"]}
        rows={points.map(({ week, solves, total }) => [
          week,
          solves,
          total,
          pairWeeks.has(week) ? "yes" : "no",
        ])}
      />
    </ChartFrame>
  );
}
