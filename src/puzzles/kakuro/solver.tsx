"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  CellGrid,
  cellKey,
  type CellAnnotation,
  type CellGridHandle,
  type CellKey,
  type CellPosition,
  type Direction,
} from "../_shared/cell-grid";
import { PuzzleKeyboard, usePadWanted } from "../_shared/puzzle-keyboard";
import { SolveSlot } from "../_shared/solve-slot";
import type { SolverProps } from "../solver-types";
import { clueRun, runCells } from "./derive";
import { combinations } from "./engine";
import type * as schema from "./schema";

type Clue = schema.Payload["clues"][number];
type Entered = schema.AttemptState["cells"][number];

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const describeClue = ({ direction, length, sum }: Clue) =>
  `${direction} ${sum} over ${length} cells`;

const position = (key: CellKey): CellPosition => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};

function ClueCorner({ across, down }: { across?: number; down?: number }) {
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 10 10"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <line
          x1="0"
          y1="0"
          x2="10"
          y2="10"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="stroke-paper"
        />
      </svg>
      {across != null && (
        <span
          aria-hidden
          className="absolute right-[8%] top-[6%] font-display text-[0.5em] font-bold leading-none text-paper"
        >
          {across}
        </span>
      )}
      {down != null && (
        <span
          aria-hidden
          className="absolute bottom-[6%] left-[8%] font-display text-[0.5em] font-bold leading-none text-paper"
        >
          {down}
        </span>
      )}
    </>
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const { rows, cols, cells, clues } = payload;
  const white = useMemo(
    () => new Set<CellKey>(cells.map(({ row, col }) => cellKey(row, col))),
    [cells],
  );
  const [digits, setDigits] = useState<ReadonlyMap<CellKey, number>>(
    () =>
      new Map(
        initialState?.cells
          .filter(({ row, col }) => white.has(cellKey(row, col)))
          .map(({ row, col, digit }) => [cellKey(row, col), digit]),
      ),
  );
  const [direction, setDirection] = useState<Direction>("across");
  const [active, setActive] = useState<CellPosition>(() =>
    [...cells].sort((a, b) => a.row - b.row || a.col - b.col)[0],
  );
  const [hints, setHints] = useState(false);
  const checkOnEntry = useRef(false);
  const grid = useRef<CellGridHandle>(null);
  const padWanted = usePadWanted();

  const clueAt = useMemo(() => {
    const byCell = new Map<CellKey, Partial<Record<Direction, Clue>>>();
    for (const clue of clues) {
      const key = cellKey(clue.row, clue.col);
      byCell.set(key, { ...byCell.get(key), [clue.direction]: clue });
    }
    return byCell;
  }, [clues]);

  const runsAt = useMemo(() => {
    const byCell = new Map<CellKey, Partial<Record<Direction, Clue>>>();
    for (const clue of clues) {
      for (const { row, col } of runCells(clueRun(clue))) {
        const key = cellKey(row, col);
        byCell.set(key, { ...byCell.get(key), [clue.direction]: clue });
      }
    }
    return byCell;
  }, [clues]);

  const wrong = useMemo(() => {
    const cellsOfBrokenRuns = new Set<CellKey>();
    for (const clue of clues) {
      const keys = runCells(clueRun(clue)).map(({ row, col }) =>
        cellKey(row, col),
      );
      const entered = keys.flatMap((key) => digits.get(key) ?? []);
      if (entered.length !== keys.length) continue;
      const total = entered.reduce((sum, digit) => sum + digit, 0);
      if (total !== clue.sum || new Set(entered).size !== entered.length) {
        for (const key of keys) cellsOfBrokenRuns.add(key);
      }
    }
    return cellsOfBrokenRuns;
  }, [clues, digits]);

  const complete = digits.size === white.size;

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            cells: Array.from(digits, ([key, digit]) => ({
              ...position(key),
              digit,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, digits]);

  useEffect(() => {
    if (checkOnEntry.current) {
      checkOnEntry.current = false;
      requestCheck?.();
    }
  }, [digits, requestCheck]);

  function change(row: number, col: number, value: string) {
    const next = new Map(digits);
    if (value) next.set(cellKey(row, col), Number(value));
    else next.delete(cellKey(row, col));
    checkOnEntry.current = Boolean(value) && next.size === white.size;
    setDigits(next);
    const state: Entered[] = Array.from(next, ([key, digit]) => ({
      ...position(key),
      digit,
    })).sort((a, b) => a.row - b.row || a.col - b.col);
    onStateChange({ cells: state });
  }

  const activeRuns = runsAt.get(cellKey(active.row, active.col));
  const actions = (
    <Toggle
      pressed={hints}
      onPressedChange={(on) => {
        setHints(on);
        grid.current?.focus();
      }}
    >
      Combinations
    </Toggle>
  );

  return (
    <div className="flex flex-col gap-6 touch:gap-0">
      <p className="sr-only">
        Type 1 to 9 to fill a cell and Backspace to clear it. Arrow keys move between
        cells and Space switches the typing direction. Each cell is read out with the
        sums of its across and down runs. A run that is full and does not add up, or
        repeats a digit, is marked.
      </p>
      <div className="mx-auto w-full max-w-xl p-4 touch:px-0">
        <CellGrid
          ref={grid}
          label="Kakuro"
          rows={rows}
          cols={cols}
          cells={white}
          value={(row, col) => String(digits.get(cellKey(row, col)) ?? "")}
          onChange={change}
          accept={(char) => /^[1-9]$/.test(char)}
          direction={direction}
          onDirectionChange={setDirection}
          active={active}
          onActiveChange={setActive}
          inputMode="numeric"
          wrong={wrong}
          words={[]}
          cellRem={4}
          annotation={(row, col): CellAnnotation | undefined => {
            const runs = runsAt.get(cellKey(row, col));
            if (!runs) return undefined;
            return {
              content: null,
              label: [runs.across, runs.down]
                .filter((clue) => clue !== undefined)
                .map(describeClue)
                .join(", "),
            };
          }}
          block={(row, col): CellAnnotation | undefined => {
            const clue = clueAt.get(cellKey(row, col));
            if (!clue) return undefined;
            return {
              content: (
                <ClueCorner across={clue.across?.sum} down={clue.down?.sum} />
              ),
              label: [clue.across, clue.down]
                .filter((c) => c !== undefined)
                .map(describeClue)
                .join(", "),
            };
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 touch:contents">
        <div className="contents touch:hidden">{actions}</div>
        {hints && (
          <ul aria-live="polite" className="flex flex-col gap-1 font-sans text-sm">
            {([activeRuns?.across, activeRuns?.down] as const)
              .filter((clue) => clue !== undefined)
              .map((clue) => (
                <li key={clue.direction}>
                  <span className="font-bold capitalize">{clue.direction}</span>{" "}
                  {clue.sum} in {clue.length}:{" "}
                  {combinations(clue.length, clue.sum)
                    .map((combo) => combo.join("+"))
                    .join(", ")}
                </li>
              ))}
          </ul>
        )}
      </div>
      <SolveSlot>
        <div className="flex flex-col gap-1 pt-2">
          {!padWanted && (
            <div
              className="flex gap-1 [&>*]:flex-1"
              onMouseDown={(event) => event.preventDefault()}
            >
              {actions}
            </div>
          )}
          <PuzzleKeyboard
            layout="digits"
            digits={DIGITS}
            onKey={(char) => grid.current?.type(char)}
            onErase={() => grid.current?.erase()}
          >
            {actions}
          </PuzzleKeyboard>
        </div>
      </SolveSlot>
    </div>
  );
}
