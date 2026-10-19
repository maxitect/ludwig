"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CellGrid, cellKey, type CellKey } from "../_shared/cell-grid";
import type { SolverProps } from "../solver-types";
import { conflictingIndexes, SYMBOLS, symbolCode } from "./engine";
import type * as schema from "./schema";

type Mark = schema.TroixSymbol;

const CYCLE: readonly (Mark | "")[] = ["", ...SYMBOLS];

const position = (key: CellKey) => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};

const byPosition = (
  a: { row: number; col: number },
  b: { row: number; col: number },
) => a.row - b.row || a.col - b.col;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  solved,
  wrongParts,
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
      new Map<CellKey, Mark>(
        payload.givens.map(({ row, col, symbol }) => [
          cellKey(row, col),
          symbol,
        ]),
      ),
    [payload.givens],
  );
  const given = useMemo(() => new Set(givens.keys()), [givens]);
  const [entries, setEntries] = useState<ReadonlyMap<CellKey, Mark>>(
    () =>
      new Map(
        initialState?.cells
          .filter(
            ({ row, col }) =>
              row < size && col < size && !givens.has(cellKey(row, col)),
          )
          .map(({ row, col, symbol }) => [cellKey(row, col), symbol]),
      ),
  );
  const checkOnEntry = useRef(false);
  const placed = useMemo(
    () => new Map<CellKey, Mark>([...entries, ...givens]),
    [entries, givens],
  );
  const complete = placed.size === size * size;

  const wrong = useMemo(() => {
    const grid = Array.from({ length: size * size }, (_, index) => {
      const symbol = placed.get(
        cellKey(Math.floor(index / size), index % size),
      );
      return symbol ? symbolCode(symbol) : 0;
    });
    const flagged = new Set(
      [...conflictingIndexes(size, grid)].map((index) =>
        cellKey(Math.floor(index / size), index % size),
      ),
    );
    for (const { row, col } of wrongParts ?? []) flagged.add(cellKey(row, col));
    return flagged;
  }, [size, placed, wrongParts]);

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(allCells, (key) => ({
              ...position(key),
              symbol: placed.get(key) ?? SYMBOLS[0],
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
    if (value) next.set(key, value.toLowerCase() as Mark);
    else next.delete(key);
    setEntries(next);
    checkOnEntry.current =
      Boolean(value) && next.size + givens.size === size * size;
    onStateChange({
      cells: Array.from(next, ([at, symbol]) => ({
        ...position(at),
        symbol,
      })).sort(byPosition),
    });
  }

  function cycle(row: number, col: number) {
    const current = entries.get(cellKey(row, col)) ?? "";
    const upcoming = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    set(row, col, upcoming.toUpperCase());
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Fill every cell with X, O or I. Each row and column holds {size / 3} of
        each symbol, and never three alike in a row.
      </p>
      <div className="mx-auto w-full max-w-xl p-4 touch:px-0">
        <CellGrid
          label="Troix"
          rows={size}
          cols={size}
          cells={allCells}
          value={(row, col) => (placed.get(cellKey(row, col)) ?? "").toUpperCase()}
          onChange={set}
          onCycle={cycle}
          accept={(char) => /^[XOI]$/.test(char)}
          readOnly={given}
          inputMode="none"
          wrong={wrong}
          words={[]}
          cellRem={5}
        />
      </div>
      <p className="sr-only">
        Tap a cell to cycle X, O, I and empty. Or press X, O or I to fill it,
        Backspace to clear, and the arrow keys to move between cells. The grid
        is checked when every cell is filled.
      </p>
      <p
        role="status"
        aria-live="polite"
        className="font-display text-sm uppercase"
      >
        {placed.size} of {size * size} cells filled
      </p>
    </div>
  );
}
