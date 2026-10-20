"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";
import { regionBorderClasses } from "./region-borders";

const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export type RegionMarkGridProps<M extends string> = {
  label: string;
  help: string;
  rows: number;
  cols: number;
  /** The region of each cell, indexed `row * cols + col`. */
  regionOf: readonly number[];
  regionName: (region: number) => string;
  marks: ReadonlyMap<number, M>;
  /** The marks a tap, Enter or Space steps through after empty. */
  cycle: readonly M[];
  /** Keys that toggle one mark, by lower-case key. */
  keys: Readonly<Record<string, M>>;
  /** The mark that is framed red when its cell is in `wrong`. */
  flagged: M;
  wrong: ReadonlySet<number>;
  solved?: boolean;
  onMark: (row: number, col: number, mark: M | undefined) => void;
  renderMark: (mark: M, wrong: boolean) => ReactNode;
  /** Printed in a cell under its mark, such as a given number. */
  cellContent?: (index: number) => ReactNode;
  /** Read after the cell's position and region, such as a given number. */
  cellLabel?: (index: number) => string | undefined;
};

/** A region-bordered grid of tappable cells with a roving cursor: arrows move, mapped keys toggle a mark, Backspace clears. */
export function RegionMarkGrid<M extends string>({
  label,
  help,
  rows,
  cols,
  regionOf,
  regionName,
  marks,
  cycle,
  keys,
  flagged,
  wrong,
  solved,
  onMark,
  renderMark,
  cellContent,
  cellLabel,
}: RegionMarkGridProps<M>) {
  const borders = useMemo(
    () =>
      regionBorderClasses(
        (row, col) => regionOf[row * cols + col],
        rows,
        cols,
      ),
    [regionOf, rows, cols],
  );
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(cursor.row * cols + cursor.col)?.focus();
  }, [cursor, cols]);

  const next = (mark: M | undefined) =>
    cycle[mark ? cycle.indexOf(mark) + 1 : 0];

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const current = marks.get(row * cols + col);
    const arrow = ARROWS[event.key];
    const toggled = keys[event.key.toLowerCase()];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, col + arrow[1])),
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMark(row, col, next(current));
    } else if (toggled) {
      event.preventDefault();
      onMark(row, col, current === toggled ? undefined : toggled);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onMark(row, col, undefined);
    }
  }

  return (
    <div className="relative w-full" style={{ maxWidth: `${cols * 3.5}rem` }}>
      <div
        role="grid"
        aria-label={label}
        aria-describedby={helpId}
        aria-disabled={solved}
        className="flex flex-col gap-px border-2 border-border bg-ink shadow-[3px_3px_0_var(--cast)] select-none"
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            role="row"
            className="grid auto-cols-fr grid-flow-col gap-px"
          >
            {Array.from({ length: cols }, (_, col) => {
              const index = row * cols + col;
              const mark = marks.get(index);
              const isCursor = cursor.row === row && cursor.col === col;
              const isWrong = wrong.has(index) && mark === flagged;
              return (
                <div
                  key={index}
                  ref={(node) => {
                    if (node) cellRefs.current.set(index, node);
                    else cellRefs.current.delete(index);
                  }}
                  role="gridcell"
                  tabIndex={isCursor ? 0 : -1}
                  aria-label={[
                    `Row ${row + 1}, column ${col + 1}`,
                    `region ${regionName(regionOf[index])}`,
                    cellLabel?.(index),
                    mark ?? "empty",
                    isWrong && "breaks a rule",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  aria-disabled={solved}
                  data-mark={mark ?? "empty"}
                  className={cn(
                    "relative aspect-square cursor-pointer bg-paper outline-0",
                    borders(row, col),
                    "focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  )}
                  onClick={() => {
                    focusCursor.current = false;
                    setCursor({ row, col });
                    onMark(row, col, next(mark));
                  }}
                  onFocus={() => {
                    focusCursor.current = true;
                    setCursor({ row, col });
                  }}
                >
                  {isWrong && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-10 border-4 border-dashed border-ludwig-red"
                    />
                  )}
                  {cellContent?.(index)}
                  {mark && (
                    <svg
                      aria-hidden
                      viewBox="0 0 10 10"
                      className="absolute inset-0 size-full"
                    >
                      {renderMark(mark, isWrong)}
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p id={helpId} className="sr-only">
        {help}
      </p>
    </div>
  );
}
