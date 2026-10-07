"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  CellGrid,
  cellKey,
  type CellEdges,
  type CellGridHandle,
  type CellKey,
} from "../_shared/cell-grid";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const SIGNS = {
  right: {
    lt: { content: "<", label: "less than the cell to the right" },
    gt: { content: ">", label: "greater than the cell to the right" },
  },
  down: {
    lt: {
      content: <span className="rotate-90">{"<"}</span>,
      label: "less than the cell below",
    },
    gt: {
      content: <span className="rotate-90">{">"}</span>,
      label: "greater than the cell below",
    },
  },
} as const;

const NOTE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const position =(key: CellKey) => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};

const byPosition = (
  a: { row: number; col: number; digit: number },
  b: { row: number; col: number; digit: number },
) => a.row - b.row || a.col - b.col || a.digit - b.digit;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const { size } = payload;
  const allCells = useMemo(
    () =>
      new Set<CellKey>(
        Array.from({ length: size * size }, (_, index) =>
          cellKey(Math.floor(index / size), index % size),
        ),
      ),
    [size],
  );
  const givens = useMemo(
    () =>
      new Map(
        payload.givens.map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
    [payload.givens],
  );
  const given = useMemo(() => new Set(givens.keys()), [givens]);
  const signs = useMemo(() => {
    const byCell = new Map<CellKey, CellEdges>();
    for (const { row, col, direction, relation } of payload.inequalities) {
      const key = cellKey(row, col);
      byCell.set(key, {
        ...byCell.get(key),
        [direction]: SIGNS[direction][relation],
      });
    }
    return byCell;
  }, [payload.inequalities]);
  const [entries, setEntries] = useState<ReadonlyMap<CellKey, number>>(
    () =>
      new Map(
        initialState?.cells
          .filter(({ row, col }) => !givens.has(cellKey(row, col)))
          .map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
  );
  const [notes, setNotes] = useState<ReadonlyMap<CellKey, ReadonlySet<number>>>(
    () => {
      const saved = new Map<CellKey, Set<number>>();
      for (const { row, col, digit } of initialState?.notes ?? []) {
        const key = cellKey(row, col);
        if (givens.has(key)) continue;
        saved.set(key, (saved.get(key) ?? new Set()).add(digit));
      }
      return saved;
    },
  );
  const [notesMode, setNotesMode] = useState(false);
  const checkOnEntry = useRef(false);
  const grid = useRef<CellGridHandle>(null);
  const complete = entries.size + givens.size === size * size;

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(allCells, (key) => ({
              ...position(key),
              digit: givens.get(key) ?? entries.get(key) ?? 0,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, allCells, givens, entries]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [entries, requestCheck]);

  function report(
    nextEntries: ReadonlyMap<CellKey, number>,
    nextNotes: ReadonlyMap<CellKey, ReadonlySet<number>>,
  ) {
    setEntries(nextEntries);
    setNotes(nextNotes);
    onStateChange({
      cells: Array.from(nextEntries, ([key, digit]) => ({
        ...position(key),
        digit,
      })).sort(byPosition),
      notes: Array.from(nextNotes, ([key, marked]) =>
        Array.from(marked, (digit) => ({ ...position(key), digit })),
      )
        .flat()
        .sort(byPosition),
    });
  }

  function change(row: number, col: number, value: string) {
    const key = cellKey(row, col);
    const nextEntries = new Map(entries);
    const nextNotes = new Map(notes);
    if (!value) {
      nextEntries.delete(key);
      nextNotes.delete(key);
    } else if (notesMode) {
      if (entries.has(key)) return;
      const marked = new Set(notes.get(key));
      const digit = Number(value);
      if (!marked.delete(digit)) marked.add(digit);
      if (marked.size) nextNotes.set(key, marked);
      else nextNotes.delete(key);
    } else {
      nextEntries.set(key, Number(value));
      nextNotes.delete(key);
      checkOnEntry.current = nextEntries.size + givens.size === size * size;
    }
    report(nextEntries, nextNotes);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === "n") setNotesMode((on) => !on);
  }

  return (
    <div className="flex flex-col gap-6" onKeyDown={onKeyDown}>
      <p className="sr-only">
        Type 1 to {size} to fill a cell and Backspace to clear it. Press N to
        switch notes on or off. Arrow keys move between cells. Signs between
        cells say which of the two is smaller, and are read out with the cell.
        The grid is checked when every cell is filled.
      </p>
      <div className="mx-auto w-full max-w-xl p-4">
        <CellGrid
          ref={grid}
          label="Futoshiki"
          rows={size}
          cols={size}
          cells={allCells}
          cellRem={5}
          value={(row, col) => {
            const key = cellKey(row, col);
            return String(givens.get(key) ?? entries.get(key) ?? "");
          }}
          onChange={change}
          accept={(char) => /^[1-9]$/.test(char) && Number(char) <= size}
          readOnly={given}
          inputMode="numeric"
          words={[]}
          edges={(row, col) => signs.get(cellKey(row, col))}
          marks={(row, col) => {
            const key = cellKey(row, col);
            const marked = notes.get(key);
            if (!marked || entries.has(key)) return null;
            return (
              <span
                aria-hidden
                className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[6%] font-hand text-[0.55em] leading-none text-ink"
              >
                {NOTE_SLOTS.map((digit) => (
                  <span
                    key={digit}
                    className="flex items-center justify-center"
                  >
                    {marked.has(digit) ? digit : ""}
                  </span>
                ))}
              </span>
            );
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          pressed={notesMode}
          onPressedChange={(on) => {
            setNotesMode(on);
            grid.current?.focus();
          }}
        >
          Notes
        </Toggle>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!notes.size}
          onClick={() => {
            report(entries, new Map());
            grid.current?.focus();
          }}
        >
          Clear notes
        </Button>
        <p role="status" aria-live="polite">
          {notesMode ? "Notes on: digits are pencilled in." : ""}
        </p>
      </div>
    </div>
  );
}
