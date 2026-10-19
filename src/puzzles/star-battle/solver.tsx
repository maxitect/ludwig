"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { RegionMarkGrid } from "../_shared/region-mark-grid";
import type { SolverProps } from "../solver-types";
import { conflictingIndexes, layoutOf } from "./engine";
import type * as schema from "./schema";

type Mark = schema.Mark;

const CYCLE: readonly Mark[] = ["dot", "star"];
const KEYS: Readonly<Record<string, Mark>> = { s: "star", ".": "dot" };

const STAR_POINTS =
  "5,0.8 6.5,3.7 9.6,4.1 7.3,6.3 7.9,9.4 5,7.9 2.1,9.4 2.7,6.3 0.4,4.1 3.5,3.7";

const regionName = (region: number) => String.fromCharCode(65 + region);

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  wrongParts,
}: SolverProps<typeof schema>) {
  const { size, stars: perUnit } = payload;
  const layout = useMemo(() => layoutOf(payload), [payload]);
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(
    () =>
      new Map(
        (initialState?.marks ?? [])
          .filter(({ row, col }) => row < size && col < size)
          .map(({ row, col, mark }) => [row * size + col, mark]),
      ),
  );
  const checkOnEntry = useRef(false);

  const total = size * perUnit;
  const starIndexes = useMemo(
    () => [...marks].flatMap(([index, mark]) => (mark === "star" ? [index] : [])),
    [marks],
  );
  const wrong = useMemo(() => {
    const flagged = conflictingIndexes(layout, starIndexes);
    for (const { row, col } of wrongParts ?? []) flagged.add(row * size + col);
    return flagged;
  }, [layout, starIndexes, wrongParts, size]);

  useEffect(() => {
    registerCheck(() =>
      starIndexes.length === total
        ? {
            stars: starIndexes.map((index) => ({
              row: Math.floor(index / size),
              col: index % size,
            })),
          }
        : null,
    );
  }, [registerCheck, starIndexes, total, size]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [marks, requestCheck]);

  function set(row: number, col: number, mark: Mark | undefined) {
    if (solved) return;
    const index = row * size + col;
    const next = new Map(marks);
    if (mark) next.set(index, mark);
    else next.delete(index);
    setMarks(next);
    checkOnEntry.current =
      mark === "star" &&
      [...next.values()].filter((value) => value === "star").length === total;
    onStateChange({
      marks: [...next]
        .sort(([a], [b]) => a - b)
        .map(([at, value]) => ({
          row: Math.floor(at / size),
          col: at % size,
          mark: value,
        })),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Place {perUnit} {perUnit === 1 ? "star" : "stars"} in every row, column
        and thick-bordered region. No two stars may touch, even diagonally.
      </p>
      <RegionMarkGrid
        label="Star battle grid"
        help="Move with the arrow keys. Press S for a star, a full stop for a dot, Backspace to clear, or Enter or Space to cycle through dot, star and empty. The grid is checked when every star is placed."
        rows={size}
        cols={size}
        regionOf={layout.regionOf}
        regionName={regionName}
        marks={marks}
        cycle={CYCLE}
        keys={KEYS}
        flagged="star"
        wrong={wrong}
        solved={solved}
        onMark={set}
        renderMark={(mark, isWrong) =>
          mark === "star" ? (
            <polygon
              points={STAR_POINTS}
              strokeWidth={0.4}
              strokeLinejoin="round"
              className={cn(
                "stroke-ink",
                isWrong ? "fill-ludwig-red" : "fill-ink",
              )}
            />
          ) : (
            <circle cx={5} cy={5} r={0.9} className="fill-ink-soft" />
          )
        }
      />
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {starIndexes.length} of {total} stars placed
      </p>
    </div>
  );
}
