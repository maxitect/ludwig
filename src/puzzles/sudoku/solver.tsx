"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/utils/cn";
import {
  CellGrid,
  cellKey,
  type CellGridHandle,
  type CellKey,
} from "../_shared/cell-grid";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const SIZE = 9;
const DIGITS = Array.from({ length: SIZE }, (_, index) => index + 1);
const DIGIT = /^[1-9]$/;

const ALL_CELLS = new Set<CellKey>(
  Array.from({ length: SIZE * SIZE }, (_, index) =>
    cellKey(Math.floor(index / SIZE), index % SIZE),
  ),
);

const boxBorders = (row: number, col: number) =>
  cn(
    col % 3 === 2 && col < SIZE - 1 && "border-r-2",
    row % 3 === 2 && row < SIZE - 1 && "border-b-2",
  );

const position = (key: CellKey) => {
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
  const givens = useMemo(
    () =>
      new Map(
        payload.givens.map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
    [payload.givens],
  );
  const given = useMemo(() => new Set(givens.keys()), [givens]);
  const [digits, setDigits] = useState<ReadonlyMap<CellKey, number>>(
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
  const complete = digits.size + givens.size === SIZE * SIZE;

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(ALL_CELLS, (key) => ({
              ...position(key),
              digit: givens.get(key) ?? digits.get(key) ?? 0,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, givens, digits]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [digits, requestCheck]);

  function report(
    nextDigits: ReadonlyMap<CellKey, number>,
    nextNotes: ReadonlyMap<CellKey, ReadonlySet<number>>,
  ) {
    setDigits(nextDigits);
    setNotes(nextNotes);
    onStateChange({
      cells: Array.from(nextDigits, ([key, digit]) => ({
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
    const nextDigits = new Map(digits);
    const nextNotes = new Map(notes);
    if (!value) {
      nextDigits.delete(key);
      nextNotes.delete(key);
    } else if (notesMode) {
      if (digits.has(key)) return;
      const marked = new Set(notes.get(key));
      const digit = Number(value);
      if (!marked.delete(digit)) marked.add(digit);
      if (marked.size) nextNotes.set(key, marked);
      else nextNotes.delete(key);
    } else {
      nextDigits.set(key, Number(value));
      nextNotes.delete(key);
      checkOnEntry.current = nextDigits.size + givens.size === SIZE * SIZE;
    }
    report(nextDigits, nextNotes);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === "n") setNotesMode((on) => !on);
  }

  return (
    <div className="flex flex-col gap-6" onKeyDown={onKeyDown}>
      <p className="sr-only">
        Type 1 to 9 to fill a cell and Backspace to clear it. Press N to switch
        notes on or off. Arrow keys move between cells. The grid is checked
        when every cell is filled.
      </p>
      <div className="mirrored-digits mx-auto w-full max-w-xl p-4">
        <CellGrid
          ref={grid}
          label="Sudoku"
          rows={SIZE}
          cols={SIZE}
          cells={ALL_CELLS}
          value={(row, col) => {
            const key = cellKey(row, col);
            return String(givens.get(key) ?? digits.get(key) ?? "");
          }}
          onChange={change}
          accept={(char) => DIGIT.test(char)}
          readOnly={given}
          cellClassName={boxBorders}
          inputMode="numeric"
          words={[]}
          marks={(row, col) => {
            const marked = notes.get(cellKey(row, col));
            if (!marked || digits.has(cellKey(row, col))) return null;
            return (
              <span
                aria-hidden
                className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[6%] font-hand text-[0.55em] leading-none text-ink"
              >
                {DIGITS.map((digit) => (
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
            report(digits, new Map());
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
