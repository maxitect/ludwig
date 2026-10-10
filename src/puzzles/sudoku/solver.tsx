"use client";

import { useMemo } from "react";
import { DigitGrid } from "../_shared/digit-grid";
import { regionBorderClasses } from "../_shared/region-borders";
import type { SolverProps } from "../solver-types";
import {
  GROUP_BACKGROUNDS,
  GROUP_LETTERS,
  boxOf,
  regionLookup,
} from "./regions";
import type * as schema from "./schema";

const SIZE = 9;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  wrongParts,
}: SolverProps<typeof schema>) {
  const { regions } = payload;
  const lookup = useMemo(() => regionLookup(regions), [regions]);
  const rainbow = regions?.kind === "rainbow";
  const borders = useMemo(
    () => regionBorderClasses(rainbow ? boxOf : lookup, SIZE, SIZE),
    [rainbow, lookup],
  );
  const annotation = useMemo(
    () =>
      rainbow
        ? (row: number, col: number) => {
            const group = lookup(row, col) ?? 0;
            return {
              content: GROUP_LETTERS[group],
              label: `colour group ${GROUP_LETTERS[group]}`,
            };
          }
        : undefined,
    [rainbow, lookup],
  );
  const cellClassName = useMemo(
    () =>
      rainbow
        ? (row: number, col: number) =>
            `${borders(row, col)} ${GROUP_BACKGROUNDS[lookup(row, col) ?? 0]}`
        : borders,
    [rainbow, borders, lookup],
  );

  return (
    <DigitGrid
      label={
        regions
          ? `${regions.kind === "jigsaw" ? "Jigsaw" : "Rainbow"} sudoku`
          : "Sudoku"
      }
      size={SIZE}
      givens={payload.givens}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
      wrongCells={wrongParts}
      cellClassName={cellClassName}
      annotation={annotation}
      instructions={`${
        regions?.kind === "jigsaw"
          ? "Each thick-bordered region holds 1 to 9 once, as do rows and columns. "
          : regions?.kind === "rainbow"
            ? "Each box, row, column and lettered colour group holds 1 to 9 once. "
            : ""
      }Type 1 to 9 to fill a cell and Backspace to clear it. Press N to switch notes on or off. Arrow keys move between cells. The grid is checked when every cell is filled.`}
    />
  );
}
