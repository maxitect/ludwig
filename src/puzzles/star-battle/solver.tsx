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
  empty: "dot",
  dot: "star",
  star: undefined,
};

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
  const borders = useMemo(
    () =>
      regionBorderClasses(
        (row, col) => layout.regionOf[row * size + col],
        size,
        size,
      ),
    [layout, size],
  );
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(
    () =>
      new Map(
        (initialState?.marks ?? [])
          .filter(({ row, col }) => row < size && col < size)
          .map(({ row, col, mark }) => [row * size + col, mark]),
      ),
  );
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);
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

  useEffect(() => {
    if (!focusCursor.current) return;
    cellRefs.current.get(cursor.row * size + cursor.col)?.focus();
  }, [cursor, size]);

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

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const current = marks.get(row * size + col);
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(size - 1, Math.max(0, row + arrow[0])),
        col: Math.min(size - 1, Math.max(0, col + arrow[1])),
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      set(row, col, NEXT[current ?? "empty"]);
    } else if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      set(row, col, current === "star" ? undefined : "star");
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
        Place {perUnit} {perUnit === 1 ? "star" : "stars"} in every row, column
        and thick-bordered region. No two stars may touch, even diagonally.
      </p>
      <div className="relative w-full" style={{ maxWidth: `${size * 3.5}rem` }}>
        <div
          role="grid"
          aria-label="Star battle grid"
          aria-describedby={helpId}
          aria-disabled={solved}
          className="flex flex-col gap-px border-2 border-border bg-ink shadow-[3px_3px_0_var(--cast)] select-none"
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: size }, (_, row) => (
            <div
              key={row}
              role="row"
              className="grid auto-cols-fr grid-flow-col gap-px"
            >
              {Array.from({ length: size }, (_, col) => {
                const index = row * size + col;
                const mark = marks.get(index);
                const isCursor = cursor.row === row && cursor.col === col;
                const isWrong = wrong.has(index) && mark === "star";
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
                        {mark === "star" ? (
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
          Move with the arrow keys. Press S for a star, a full stop for a dot,
          Backspace to clear, or Enter or Space to cycle through dot, star and
          empty. The grid is checked when every star is placed.
        </p>
      </div>
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {starIndexes.length} of {total} stars placed
      </p>
    </div>
  );
}
