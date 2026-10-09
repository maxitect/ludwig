"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/utils/cn";
import { cellRotation } from "../_shared/cell-grid/cell-grid";
import type { SolverProps } from "../solver-types";
import { describeCell } from "./derive";
import type * as schema from "./schema";

type Observer = schema.Payload["observers"][number];

const BEARING = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315,
} as const satisfies Record<Observer["facing"], number>;

const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const WEDGE_RADIUS = 1.5;

const key = (row: number, col: number) => `${row},${col}`;

const toMarks = (cells: Set<string>) =>
  [...cells].map((cell) => {
    const [row, col] = cell.split(",").map(Number);
    return { row, col };
  });

/** The facing wedge as an SVG path in cell units, apex on the observer. */
function wedgePath({ row, col, facing, fovDeg }: Observer) {
  const cx = col + 0.5;
  const cy = row + 0.5;
  const point = (bearing: number): [number, number] => {
    const rad = (bearing * Math.PI) / 180;
    return [
      cx + WEDGE_RADIUS * Math.sin(rad),
      cy - WEDGE_RADIUS * Math.cos(rad),
    ];
  };
  if (fovDeg >= 360) {
    return `M ${cx + WEDGE_RADIUS} ${cy} A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 1 1 ${cx - WEDGE_RADIUS} ${cy} A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 1 1 ${cx + WEDGE_RADIUS} ${cy} Z`;
  }
  const [x1, y1] = point(BEARING[facing] - fovDeg / 2);
  const [x2, y2] = point(BEARING[facing] + fovDeg / 2);
  const large = fovDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

/** Red pencil hatching across one cell, each stroke nudged by a jitter seeded from the cell. */
function hatching(row: number, col: number) {
  const seed = row * 31 + col;
  return [0.2, 0.5, 0.8].map((offset, i) => {
    const nudge = cellRotation(seed + i * 7) * 0.03;
    return `M ${col + 0.12 + nudge} ${row + offset + 0.18} L ${col + 0.88 - nudge} ${row + offset - 0.18 + nudge}`;
  });
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const { rows, cols, obstacles, observers, targetRow, targetCol } = payload;
  const pillars = useMemo(
    () => new Set(obstacles.map(({ row, col }) => key(row, col))),
    [obstacles],
  );
  const [marked, setMarked] = useState<Set<string>>(
    () =>
      new Set(
        (initialState?.marks ?? [])
          .filter(
            ({ row, col }) =>
              row < rows && col < cols && !pillars.has(key(row, col)),
          )
          .map(({ row, col }) => key(row, col)),
      ),
  );
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const focusCursor = useRef(false);

  const marks = useMemo(() => toMarks(marked), [marked]);

  useEffect(() => {
    registerCheck(() => (marks.length ? { marks } : null));
  }, [registerCheck, marks]);

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(key(cursor.row, cursor.col))?.focus();
  }, [cursor]);

  function toggle(row: number, col: number) {
    const cell = key(row, col);
    if (solved || pillars.has(cell)) return;
    const next = new Set(marked);
    if (!next.delete(cell)) next.add(cell);
    setMarked(next);
    onStateChange({ marks: toMarks(next) });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, cursor.row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, cursor.col + arrow[1])),
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(cursor.row, cursor.col);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Pillars block the view. Mark every floor cell that no observer can
        see, the alcove included.
      </p>
      <div
        className="relative w-full"
        style={{ maxWidth: `${cols * 3}rem` }}
      >
        <div
          role="grid"
          aria-label="Sightlines floor plan"
          aria-describedby={helpId}
          aria-disabled={solved}
          className="relative flex flex-col border-2 border-border bg-paper-shade shadow-[3px_3px_0_var(--cast)] select-none"
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: rows }, (_, row) => (
            <div
              key={row}
              role="row"
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {Array.from({ length: cols }, (_, col) => {
                const cell = key(row, col);
                const isPillar = pillars.has(cell);
                const isMarked = marked.has(cell);
                const isCursor = cursor.row === row && cursor.col === col;
                return (
                  <div
                    key={cell}
                    ref={(node) => {
                      if (node) cellRefs.current.set(cell, node);
                      else cellRefs.current.delete(cell);
                    }}
                    role="gridcell"
                    tabIndex={isCursor ? 0 : -1}
                    aria-label={`Row ${row + 1}, column ${col + 1}, ${describeCell(payload, row, col)}${isMarked ? ", marked as a blind spot" : ""}`}
                    aria-selected={isPillar ? undefined : isMarked}
                    aria-disabled={isPillar || solved}
                    data-marked={isMarked}
                    className={cn(
                      "aspect-square border border-paper-deep outline-0",
                      isPillar
                        ? "bg-shadow"
                        : "cursor-pointer hover:bg-paper-deep",
                      "focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    )}
                    onClick={() => {
                      focusCursor.current = false;
                      setCursor({ row, col });
                      toggle(row, col);
                    }}
                    onFocus={() => {
                      focusCursor.current = true;
                      setCursor({ row, col });
                    }}
                  />
                );
              })}
            </div>
          ))}
          <svg
            aria-hidden
            viewBox={`0 0 ${cols} ${rows}`}
            className="pointer-events-none absolute inset-0 size-full"
          >
            <circle
              cx={targetCol + 0.5}
              cy={targetRow + 0.5}
              r={0.36}
              fill="none"
              strokeWidth={0.07}
              strokeDasharray="0.14 0.1"
              className="stroke-ink"
            />
            {observers.map((observer) => (
              <g key={key(observer.row, observer.col)}>
                <path
                  d={wedgePath(observer)}
                  strokeWidth={0.05}
                  strokeLinejoin="round"
                  className="fill-ludwig-red/25 stroke-ludwig-red"
                />
                <circle
                  cx={observer.col + 0.5}
                  cy={observer.row + 0.5}
                  r={0.2}
                  className="fill-ink"
                />
              </g>
            ))}
            {marks.map(({ row, col }) =>
              hatching(row, col).map((d) => (
                <path
                  key={`${row},${col},${d}`}
                  d={d}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={0.07}
                  className="stroke-ludwig-red"
                />
              )),
            )}
          </svg>
        </div>
        <p id={helpId} className="sr-only">
          Move with the arrow keys and press Enter or Space to mark or clear a
          cell. Pillars cannot be marked.
        </p>
      </div>
      <p role="status" className="font-display text-sm uppercase">
        {marks.length} {marks.length === 1 ? "cell" : "cells"} marked
      </p>
    </div>
  );
}
