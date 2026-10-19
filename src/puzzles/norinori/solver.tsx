"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RegionMarkGrid } from "../_shared/region-mark-grid";
import type { SolverProps } from "../solver-types";
import { conflictingIndexes, layoutOf } from "./engine";
import type * as schema from "./schema";

type Mark = schema.Mark;

const CYCLE: readonly Mark[] = ["shade", "dot"];
const KEYS: Readonly<Record<string, Mark>> = { s: "shade", ".": "dot" };

const regionName = (region: number) => region.toString(36).toUpperCase();

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  wrongParts,
}: SolverProps<typeof schema>) {
  const { rows, cols } = payload;
  const layout = useMemo(() => layoutOf(payload), [payload]);
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(
    () =>
      new Map(
        (initialState?.marks ?? [])
          .filter(({ row, col }) => row < rows && col < cols)
          .map(({ row, col, mark }) => [row * cols + col, mark]),
      ),
  );
  const checkOnEntry = useRef(false);

  const total = useMemo(() => new Set(layout.regionOf).size * 2, [layout]);
  const shadedIndexes = useMemo(
    () => [...marks].flatMap(([index, mark]) => (mark === "shade" ? [index] : [])),
    [marks],
  );
  const wrong = useMemo(() => {
    const flagged = conflictingIndexes(layout, shadedIndexes);
    for (const { row, col } of wrongParts ?? []) flagged.add(row * cols + col);
    return flagged;
  }, [layout, shadedIndexes, wrongParts, cols]);

  useEffect(() => {
    registerCheck(() =>
      shadedIndexes.length === total
        ? {
            shaded: shadedIndexes.map((index) => ({
              row: Math.floor(index / cols),
              col: index % cols,
            })),
          }
        : null,
    );
  }, [registerCheck, shadedIndexes, total, cols]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [marks, requestCheck]);

  function set(row: number, col: number, mark: Mark | undefined) {
    if (solved) return;
    const index = row * cols + col;
    const next = new Map(marks);
    if (mark) next.set(index, mark);
    else next.delete(index);
    setMarks(next);
    checkOnEntry.current =
      mark === "shade" &&
      [...next.values()].filter((value) => value === "shade").length === total;
    onStateChange({
      marks: [...next]
        .sort(([a], [b]) => a - b)
        .map(([at, value]) => ({
          row: Math.floor(at / cols),
          col: at % cols,
          mark: value,
        })),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Shade two cells in every thick-bordered region. Each shaded cell must
        join exactly one other shaded cell to make a domino, and no two
        dominoes may touch along an edge.
      </p>
      <RegionMarkGrid
        label="Norinori grid"
        help="Move with the arrow keys. Press S to shade, a full stop for a dot, Backspace to clear, or Enter or Space to cycle through shade, dot and empty. The grid is checked when every cell is shaded."
        rows={rows}
        cols={cols}
        regionOf={layout.regionOf}
        regionName={regionName}
        marks={marks}
        cycle={CYCLE}
        keys={KEYS}
        flagged="shade"
        wrong={wrong}
        solved={solved}
        onMark={set}
        renderMark={(mark, isWrong) =>
          mark === "shade" ? (
            <rect
              x={0}
              y={0}
              width={10}
              height={10}
              className={isWrong ? "fill-ludwig-red" : "fill-ink"}
            />
          ) : (
            <circle cx={5} cy={5} r={0.9} className="fill-ink-soft" />
          )
        }
      />
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {shadedIndexes.length} of {total} cells shaded
      </p>
    </div>
  );
}
