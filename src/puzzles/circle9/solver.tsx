"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RegionMarkGrid } from "../_shared/region-mark-grid";
import type { SolverProps } from "../solver-types";
import { SIZE, boxOf, cellOf, clashingIndexes, layoutOf } from "./engine";
import type * as schema from "./schema";

const CIRCLED = "circled";
type Circled = typeof CIRCLED;

const CYCLE: readonly Circled[] = [CIRCLED];
const KEYS: Readonly<Record<string, Circled>> = { c: CIRCLED };
const BOXES = Array.from({ length: SIZE * SIZE }, (_, index) => boxOf(index));

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  wrongParts,
}: SolverProps<typeof schema>) {
  const layout = useMemo(() => layoutOf(payload), [payload]);
  const { digits } = layout;
  const [circles, setCircles] = useState<ReadonlyMap<number, Circled>>(
    () =>
      new Map(
        (initialState?.circles ?? [])
          .map(({ row, col }) => row * SIZE + col)
          .filter((index) => digits[index])
          .map((index) => [index, CIRCLED]),
      ),
  );
  const checkOnEntry = useRef(false);

  const wrong = useMemo(() => {
    const flagged = clashingIndexes(layout, circles.keys());
    for (const { row, col } of wrongParts ?? []) flagged.add(row * SIZE + col);
    return flagged;
  }, [layout, circles, wrongParts]);

  useEffect(() => {
    registerCheck(() =>
      circles.size === SIZE
        ? { circles: [...circles.keys()].sort((a, b) => a - b).map(cellOf) }
        : null,
    );
  }, [registerCheck, circles]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [circles, requestCheck]);

  function set(row: number, col: number, mark: Circled | undefined) {
    const index = row * SIZE + col;
    if (solved || !digits[index]) return;
    const next = new Map(circles);
    if (mark) next.set(index, mark);
    else next.delete(index);
    setCircles(next);
    checkOnEntry.current = mark === CIRCLED && next.size === SIZE;
    onStateChange({
      circles: [...next.keys()].sort((a, b) => a - b).map(cellOf),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        This is not a Sudoku. Circle nine of the numbers: one of each digit
        from 1 to 9, with exactly one circle in every row, every column and
        every 3 by 3 box.
      </p>
      <RegionMarkGrid
        label="Circle9 grid"
        help="Move with the arrow keys. Press C, Enter or Space to circle a number, and Backspace to clear the circle. Empty cells cannot be circled. The grid is checked when nine numbers are circled."
        rows={SIZE}
        cols={SIZE}
        regionOf={BOXES}
        regionName={(box) => String(box + 1)}
        marks={circles}
        cycle={CYCLE}
        keys={KEYS}
        flagged={CIRCLED}
        wrong={wrong}
        solved={solved}
        onMark={set}
        cellLabel={(index) =>
          digits[index] ? `number ${digits[index]}` : undefined
        }
        cellContent={(index) =>
          digits[index] ? (
            <svg
              aria-hidden
              viewBox="0 0 10 10"
              className="absolute inset-0 size-full"
            >
              <text
                x={5}
                y={5}
                fontSize={6.2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-ink font-display"
              >
                {digits[index]}
              </text>
            </svg>
          ) : null
        }
        renderMark={() => (
          <ellipse
            cx={5}
            cy={5}
            rx={4.3}
            ry={3.7}
            transform="rotate(-10 5 5)"
            className="fill-none stroke-ludwig-red"
            strokeWidth={0.7}
          />
        )}
      />
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {circles.size} of {SIZE} numbers circled
      </p>
    </div>
  );
}
