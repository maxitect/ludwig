"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CellGrid,
  cellKey,
  type CellGridHandle,
  type CellKey,
} from "../_shared/cell-grid";
import { regionBorderClasses } from "../_shared/region-borders";
import { PuzzleKeyboard } from "../_shared/puzzle-keyboard";
import { SolveSlot } from "../_shared/solve-slot";
import type { SolverProps } from "../solver-types";
import { brokenIndexes } from "./engine";
import type * as schema from "./schema";

type Entered = schema.AttemptState["cells"][number];

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const position = (key: CellKey) => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};

const byPosition = (a: Entered, b: Entered) => a.row - b.row || a.col - b.col;

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
  const allCells = useMemo(
    () =>
      new Set<CellKey>(
        Array.from({ length: rows * cols }, (_, index) =>
          cellKey(Math.floor(index / cols), index % cols),
        ),
      ),
    [rows, cols],
  );
  const givens = useMemo(
    () =>
      new Map<CellKey, number>(
        payload.givens.map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
    [payload.givens],
  );
  const given = useMemo(() => new Set(givens.keys()), [givens]);
  const [entries, setEntries] = useState<ReadonlyMap<CellKey, number>>(
    () =>
      new Map(
        initialState?.cells
          .filter(
            ({ row, col }) =>
              row < rows && col < cols && !givens.has(cellKey(row, col)),
          )
          .map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
  );
  const checkOnEntry = useRef(false);
  const grid = useRef<CellGridHandle>(null);
  const placed = useMemo(
    () => new Map<CellKey, number>([...entries, ...givens]),
    [entries, givens],
  );
  const complete = placed.size === rows * cols;

  const digitAt = (row: number, col: number) =>
    placed.get(cellKey(row, col)) ?? 0;

  const wrong = useMemo(() => {
    const digits = Array.from(
      { length: rows * cols },
      (_, index) =>
        placed.get(cellKey(Math.floor(index / cols), index % cols)) ?? 0,
    );
    const flagged = new Set(
      [...brokenIndexes({ rows, cols }, digits)].map((index) =>
        cellKey(Math.floor(index / cols), index % cols),
      ),
    );
    for (const { row, col } of wrongParts ?? []) flagged.add(cellKey(row, col));
    return flagged;
  }, [rows, cols, placed, wrongParts]);

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(allCells, (key) => ({
              ...position(key),
              digit: placed.get(key) ?? 1,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, allCells, placed]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [entries, requestCheck]);

  function set(row: number, col: number, value: string) {
    if (solved) return;
    const key = cellKey(row, col);
    const next = new Map(entries);
    if (value) next.set(key, Number(value));
    else next.delete(key);
    setEntries(next);
    checkOnEntry.current =
      Boolean(value) && next.size + givens.size === rows * cols;
    onStateChange({
      cells: Array.from(next, ([at, digit]) => ({
        ...position(at),
        digit,
      })).sort(byPosition),
    });
  }

  const cellClassName = regionBorderClasses(
    (row, col) => digitAt(row, col) || undefined,
    rows,
    cols,
  );

  return (
    <div className="flex flex-col gap-6 touch:gap-0">
      <p className="sr-only">
        Type 1 to 9 to fill a cell and Backspace to clear it. Arrow keys move
        between cells. Every group of touching equal digits must hold as many
        cells as its digit, and two groups of one size never touch. Thick lines
        separate different digits, and a group of the wrong size is marked. The
        grid is checked when every cell is filled.
      </p>
      <div className="mx-auto w-full max-w-xl p-4 touch:px-0">
        <CellGrid
          ref={grid}
          label="Fillomino"
          rows={rows}
          cols={cols}
          cells={allCells}
          value={(row, col) => String(digitAt(row, col) || "")}
          onChange={set}
          accept={(char) => /^[1-9]$/.test(char)}
          readOnly={given}
          cellClassName={cellClassName}
          inputMode="none"
          wrong={wrong}
          words={[]}
          cellRem={4}
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        className="font-display text-sm uppercase"
      >
        {placed.size} of {rows * cols} cells filled
      </p>
      <SolveSlot>
        <div className="flex flex-col gap-1 pt-2">
          <PuzzleKeyboard
            layout="digits"
            digits={DIGITS}
            onKey={(char) => grid.current?.type(char)}
            onErase={() => grid.current?.erase()}
          />
        </div>
      </SolveSlot>
    </div>
  );
}
