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
import { regionBorderClasses } from "../_shared/region-borders";
import type { SolverProps } from "../solver-types";
import { conflictingIndexes, layoutOf } from "./engine";
import type * as schema from "./schema";

type Mark = schema.Mark;

const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const NEXT: Record<Mark | "empty", Mark | undefined> = {
  empty: "shade",
  shade: "dot",
  dot: undefined,
};

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
  const borders = useMemo(
    () =>
      regionBorderClasses(
        (row, col) => layout.regionOf[row * cols + col],
        rows,
        cols,
      ),
    [layout, rows, cols],
  );
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(
    () =>
      new Map(
        (initialState?.marks ?? [])
          .filter(({ row, col }) => row < rows && col < cols)
          .map(({ row, col, mark }) => [row * cols + col, mark]),
      ),
  );
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);
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

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(cursor.row * cols + cursor.col)?.focus();
  }, [cursor, cols]);

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

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const current = marks.get(row * cols + col);
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, col + arrow[1])),
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      set(row, col, NEXT[current ?? "empty"]);
    } else if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      set(row, col, current === "shade" ? undefined : "shade");
    } else if (event.key === ".") {
      event.preventDefault();
      set(row, col, current === "dot" ? undefined : "dot");
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      set(row, col, undefined);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Shade two cells in every thick-bordered region. Each shaded cell must
        join exactly one other shaded cell to make a domino, and no two
        dominoes may touch along an edge.
      </p>
      <div className="relative w-full" style={{ maxWidth: `${cols * 3.5}rem` }}>
        <div
          role="grid"
          aria-label="Norinori grid"
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
                const isWrong = wrong.has(index) && mark === "shade";
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
                      `region ${regionName(layout.regionOf[index])}`,
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
                      set(row, col, NEXT[mark ?? "empty"]);
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
                    {mark && (
                      <svg
                        aria-hidden
                        viewBox="0 0 10 10"
                        className="absolute inset-0 size-full"
                      >
                        {mark === "shade" ? (
                          <rect
                            x={0}
                            y={0}
                            width={10}
                            height={10}
                            className={isWrong ? "fill-ludwig-red" : "fill-ink"}
                          />
                        ) : (
                          <circle cx={5} cy={5} r={0.9} className="fill-ink-soft" />
                        )}
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p id={helpId} className="sr-only">
          Move with the arrow keys. Press S to shade, a full stop for a dot,
          Backspace to clear, or Enter or Space to cycle through shade, dot and
          empty. The grid is checked when every cell is shaded.
        </p>
      </div>
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {shadedIndexes.length} of {total} cells shaded
      </p>
    </div>
  );
}
