"use client";

import { useState } from "react";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { Button } from "@/components/ui/button";
import type { DeskCharts } from "@/lib/data/desk-charts";
import { SPARK_SOLVES } from "@/config/desk";
import { formatDuration } from "@/utils/format-duration";
import { ChartFrame, DataTable, Tip, useIntro, useTip } from "./chart-parts";
import { plural } from "./chart-model";

const SPARK_W = 120;
const SPARK_H = 36;
const GAP = 3;
const COLLAPSED_TILES = 6;

export function TypeTiles({
  types,
  categoryName,
}: {
  types: DeskCharts["types"];
  categoryName: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? types : types.slice(0, COLLAPSED_TILES);
  return (
    <ChartFrame
      id="chart-types"
      question={categoryName ? `How do I do at ${categoryName}?` : "How do I do at each type?"}
    >
      {types.length === 0 ? (
        <p>No solves in this category yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((type) => (
            <TypeTile key={type.key} type={type} />
          ))}
        </ul>
      )}
      {types.length > COLLAPSED_TILES && (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer types" : `Show all ${types.length} types`}
        </Button>
      )}
      <p className="text-xs font-semibold">
        Bars are your last {SPARK_SOLVES} solve times, oldest first; the red bar is the latest. Taller is slower.
      </p>
      <DataTable
        caption="Solves by puzzle type"
        head={["Type", "Solves", "Best time", "Median time", "Recent times"]}
        rows={types.map(({ name, solves, bestDurationMs, medianDurationMs, recent }) => [
          name,
          solves,
          formatDuration(bestDurationMs),
          formatDuration(medianDurationMs),
          recent.map(formatDuration).join(", "),
        ])}
      />
    </ChartFrame>
  );
}

function TypeTile({ type }: { type: DeskCharts["types"][number] }) {
  const intro = useIntro<SVGSVGElement>();
  const { frame, tip, show, hide } = useTip<HTMLLIElement>();
  const slowest = max(type.recent) ?? 1;
  const height = scaleLinear().domain([0, slowest]).range([3, SPARK_H]);
  const step = SPARK_W / SPARK_SOLVES;
  const summary = `${type.name}: ${plural(type.solves, "solve")}, best ${formatDuration(type.bestDurationMs)}`;

  return (
    <li
      ref={frame}
      tabIndex={0}
      aria-label={summary}
      onFocus={(event) => show(event.currentTarget, summary, { x: 60, y: 0 })}
      onBlur={hide}
      className="relative flex flex-col gap-1 border-2 border-border p-3 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="font-display text-sm font-bold tracking-[0.04em] uppercase">
        {type.name}
      </span>
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl font-bold">{type.solves}</span>
        <span className="text-xs font-semibold">
          best {formatDuration(type.bestDurationMs)}
        </span>
      </span>
      <svg
        ref={intro}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        className="h-9 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1={0}
          x2={SPARK_W}
          y1={SPARK_H - 0.5}
          y2={SPARK_H - 0.5}
          strokeWidth={1}
          className="stroke-grid-blue ink:stroke-muted"
          vectorEffect="non-scaling-stroke"
        />
        {type.recent.map((duration, i) => {
          const h = height(duration);
          const latest = i === type.recent.length - 1;
          return (
            <rect
              key={i}
              x={i * step + GAP / 2}
              y={SPARK_H - h}
              width={step - GAP}
              height={h}
              data-grow-h={h}
              className={latest ? "fill-primary" : "fill-foreground"}
              onPointerEnter={(event) =>
                show(event.currentTarget, `Solve ${i + 1} of ${type.recent.length}: ${formatDuration(duration)}`)
              }
              onPointerLeave={hide}
            />
          );
        })}
      </svg>
      <Tip tip={tip} />
    </li>
  );
}
