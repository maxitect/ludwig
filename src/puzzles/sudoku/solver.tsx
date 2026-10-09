"use client";

import { cn } from "@/utils/cn";
import { DigitGrid } from "../_shared/digit-grid";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const SIZE = 9;

const boxBorders = (row: number, col: number) =>
  cn(
    col % 3 === 2 && col < SIZE - 1 && "border-r-2 border-ink",
    row % 3 === 2 && row < SIZE - 1 && "border-b-2 border-ink",
  );

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  wrongParts,
}: SolverProps<typeof schema>) {
  return (
    <DigitGrid
      label="Sudoku"
      size={SIZE}
      givens={payload.givens}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
      wrongCells={wrongParts}
      cellClassName={boxBorders}
      instructions="Type 1 to 9 to fill a cell and Backspace to clear it. Press N to switch notes on or off. Arrow keys move between cells. The grid is checked when every cell is filled."
    />
  );
}
