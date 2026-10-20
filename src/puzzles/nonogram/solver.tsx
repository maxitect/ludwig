"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/utils/cn";
import type { SolverProps } from "../solver-types";
import { runsOf } from "./derive";
import type * as schema from "./schema";

type Mark = schema.Mark;

const CYCLE: readonly (Mark | undefined)[] = [undefined, "fill", "cross"];
const GUIDE = 5;
const ARROWS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const clueText = (clue: readonly number[]) =>
  clue.length ? clue.join(" ") : "none";
const sameRuns = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((run, i) => run === b[i]);
const nextMark = (mark: Mark | undefined) =>
  CYCLE[(CYCLE.indexOf(mark) + 1) % CYCLE.length];

/** Ink lines under and to the right of a cell, doubled on every fifth line so a long clue can be counted off. */
function lines(row: number, col: number, rows: number, cols: number) {
  const right = (col + 1) % GUIDE === 0 && col + 1 < cols ? 2 : 1;
  const below = (row + 1) % GUIDE === 0 && row + 1 < rows ? 2 : 1;
  return [
    `inset -${right}px 0 0 var(--color-ink)`,
    `inset 0 -${below}px 0 var(--color-ink)`,
    row === 0 && "inset 0 1px 0 var(--color-ink)",
    col === 0 && "inset 1px 0 0 var(--color-ink)",
  ]
    .filter(Boolean)
    .join(", ");
}

function Clue({
  clue,
  satisfied,
  active,
  vertical,
  label,
}: {
  clue: readonly number[];
  satisfied: boolean;
  active: boolean;
  vertical?: boolean;
  label: string;
}) {
  return (
    <div
      aria-label={`${label}, clue ${clueText(clue)}${satisfied ? ", complete" : ""}`}
      data-satisfied={satisfied}
      className={cn(
        "flex items-center justify-end gap-[0.3em] px-[0.3em] font-display text-[0.7rem] leading-tight font-bold tabular-nums sm:text-sm",
        vertical ? "flex-col justify-end py-[0.3em]" : "flex-row",
        satisfied && "opacity-35",
        active && "bg-paper-shade",
      )}
    >
      {(clue.length ? clue : [0]).map((run, i) => (
        <span key={i} aria-hidden>
          {run}
        </span>
      ))}
    </div>
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
}: SolverProps<typeof schema>) {
  const { rows, cols, rowClues, colClues } = payload;
  const [marks, setMarks] = useState<ReadonlyMap<number, Mark>>(
    () =>
      new Map(
        (initialState?.marks ?? [])
          .filter(({ row, col }) => row < rows && col < cols)
          .map(({ row, col, mark }) => [row * cols + col, mark]),
      ),
  );
  const marksRef = useRef(marks);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const helpId = useId();
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const focusCursor = useRef(false);
  const checkOnEntry = useRef(false);
  const drag = useRef<{
    value: Mark | undefined;
    row: number;
    col: number;
    axis: "row" | "col" | null;
    last: number;
  } | null>(null);

  const rowSatisfied = useMemo(
    () =>
      rowClues.map((clue, row) =>
        sameRuns(
          runsOf(
            Array.from({ length: cols }, (_, col) => marks.get(row * cols + col) === "fill"),
          ),
          clue,
        ),
      ),
    [rowClues, marks, cols],
  );
  const colSatisfied = useMemo(
    () =>
      colClues.map((clue, col) =>
        sameRuns(
          runsOf(
            Array.from({ length: rows }, (_, row) => marks.get(row * cols + col) === "fill"),
          ),
          clue,
        ),
      ),
    [colClues, marks, rows, cols],
  );
  const complete = rowSatisfied.every(Boolean) && colSatisfied.every(Boolean);
  const done = rowSatisfied.filter(Boolean).length + colSatisfied.filter(Boolean).length;

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            shaded: [...marks].flatMap(([index, mark]) =>
              mark === "fill"
                ? [{ row: Math.floor(index / cols), col: index % cols }]
                : [],
            ),
          }
        : null,
    );
  }, [registerCheck, complete, marks, cols]);

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

  function set(index: number, mark: Mark | undefined) {
    if (solved || marksRef.current.get(index) === mark) return;
    const next = new Map(marksRef.current);
    if (mark) next.set(index, mark);
    else next.delete(index);
    marksRef.current = next;
    setMarks(next);
    checkOnEntry.current = mark === "fill";
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

  const cellOf = (target: EventTarget | Element | null) => {
    const node = (target as Element | null)?.closest<HTMLElement>("[data-index]");
    return node ? Number(node.dataset.index) : null;
  };

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (solved || (event.pointerType === "mouse" && event.button !== 0)) return;
    const index = cellOf(event.target);
    if (index === null) return;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const value = nextMark(marksRef.current.get(index));
    drag.current = { value, row, col, axis: null, last: index };
    focusCursor.current = false;
    setCursor({ row, col });
    set(index, value);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const index = cellOf(hovered);
    if (index === null || index === current.last) return;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const axis = current.axis ?? (row !== current.row ? "col" : "row");
    if ((axis === "row" && row !== current.row) || (axis === "col" && col !== current.col)) {
      return;
    }
    current.axis = axis;
    current.last = index;
    set(index, current.value);
  }

  const endDrag = () => {
    drag.current = null;
  };

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { row, col } = cursor;
    const index = row * cols + col;
    const current = marksRef.current.get(index);
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      focusCursor.current = true;
      setCursor({
        row: Math.min(rows - 1, Math.max(0, row + arrow[0])),
        col: Math.min(cols - 1, Math.max(0, col + arrow[1])),
      });
    } else if (event.key === " ") {
      event.preventDefault();
      set(index, current === "fill" ? undefined : "fill");
    } else if (event.key.toLowerCase() === "x") {
      event.preventDefault();
      set(index, current === "cross" ? undefined : "cross");
    } else if (event.key === "Enter") {
      event.preventDefault();
      set(index, nextMark(current));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      set(index, undefined);
    }
  }

  const rowClueChars = Math.max(
    ...rowClues.map((clue) => clue.join("").length + (clue.length - 1) * 0.4),
    1,
  );
  const clueWidth = `calc(${rowClueChars}ch + 0.8em)`;

  return (
    <div className="flex flex-col gap-4">
      <p>
        Shade the cells so each row and column holds runs of the lengths its
        clue lists, in order, with at least one empty cell between runs. Mark
        cells you know are empty with a cross. Solve it and the picture
        appears.
      </p>
      <div
        className="paper-sheet mx-auto w-full p-2 select-none"
        style={{ maxWidth: `calc(${cols} * 2.25rem + ${clueWidth} + 1rem)` }}
      >
        <div
          role="grid"
          aria-label="Nonogram grid"
          aria-describedby={helpId}
          aria-disabled={solved}
          data-solved={solved ? "true" : undefined}
          className="flex w-full flex-col touch-none"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div role="row" className="flex" style={{ minHeight: "1.5rem" }}>
            <div style={{ width: clueWidth }} className="shrink-0" />
            {colClues.map((clue, col) => (
              <div
                key={col}
                role="columnheader"
                className="flex min-w-0 flex-1 flex-col justify-end"
              >
                <Clue
                  clue={clue}
                  vertical
                  label={`Column ${col + 1}`}
                  satisfied={colSatisfied[col]}
                  active={cursor.col === col && !solved}
                />
              </div>
            ))}
          </div>
          {rowClues.map((clue, row) => (
            <div key={row} role="row" className="flex">
              <div
                role="rowheader"
                style={{ width: clueWidth }}
                className="flex shrink-0"
              >
                <Clue
                  clue={clue}
                  label={`Row ${row + 1}`}
                  satisfied={rowSatisfied[row]}
                  active={cursor.row === row && !solved}
                />
              </div>
              {Array.from({ length: cols }, (_, col) => {
                const index = row * cols + col;
                const mark = marks.get(index);
                const isCursor = cursor.row === row && cursor.col === col;
                return (
                  <div
                    key={index}
                    ref={(node) => {
                      if (node) cellRefs.current.set(index, node);
                      else cellRefs.current.delete(index);
                    }}
                    role="gridcell"
                    data-index={index}
                    data-mark={mark ?? "empty"}
                    tabIndex={isCursor ? 0 : -1}
                    aria-disabled={solved}
                    aria-label={[
                      `Row ${row + 1}, column ${col + 1}`,
                      `row clue ${clueText(clue)}`,
                      `column clue ${clueText(colClues[col])}`,
                      mark ?? "empty",
                    ].join(", ")}
                    style={{
                      boxShadow: solved ? undefined : lines(row, col, rows, cols),
                    }}
                    className="relative aspect-square min-w-0 flex-1 cursor-pointer bg-paper outline-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    onFocus={() => {
                      focusCursor.current = true;
                      setCursor({ row, col });
                    }}
                  >
                    {mark === "fill" && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute bg-ink",
                          solved ? "inset-0" : "inset-[2px]",
                        )}
                      />
                    )}
                    {mark === "cross" && !solved && (
                      <svg
                        aria-hidden
                        viewBox="0 0 10 10"
                        className="absolute inset-0 size-full"
                      >
                        <path
                          d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
                          className="stroke-ink-soft"
                          strokeWidth={0.9}
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p id={helpId} className="sr-only">
        Move with the arrow keys. Press Space to fill a cell, X to cross it as
        empty, Backspace to clear it, or Enter to cycle through filled,
        crossed and empty. Each cell reads out its row clue and column clue.
        Tap or click a cell to cycle it, and drag along a line to paint a
        run. The grid is checked when every clue is met.
      </p>
      <p role="status" aria-live="polite" className="font-display text-sm uppercase">
        {done} of {rows + cols} clues met
      </p>
    </div>
  );
}
