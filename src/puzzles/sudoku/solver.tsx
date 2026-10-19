"use client";

import { useMemo } from "react";
import {
  cellKey,
  type CellEdges,
  type CellKey,
} from "../_shared/cell-grid";
import { DigitGrid } from "../_shared/digit-grid";
import { regionBorderClasses } from "../_shared/region-borders";
import type { SolverProps } from "../solver-types";
import { CageOutline, lookupCages } from "./cages";
import {
  GROUP_BACKGROUNDS,
  GROUP_LETTERS,
  boxOf,
  regionLookup,
} from "./regions";
import type * as schema from "./schema";

const SIZE = 9;

const MARKS = {
  right: {
    x: {
      content: "X",
      label: "adds up to 10 with the cell to the right",
      neighbourLabel: "adds up to 10 with the cell to the left",
    },
    v: {
      content: "V",
      label: "adds up to 5 with the cell to the right",
      neighbourLabel: "adds up to 5 with the cell to the left",
    },
  },
  down: {
    x: {
      content: "X",
      label: "adds up to 10 with the cell below",
      neighbourLabel: "adds up to 10 with the cell above",
    },
    v: {
      content: "V",
      label: "adds up to 5 with the cell below",
      neighbourLabel: "adds up to 5 with the cell above",
    },
  },
} as const;

const plural = (count: number) => (count === 1 ? "cell" : "cells");

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
  wrongParts,
}: SolverProps<typeof schema>) {
  const { regions, cages, xv } = payload;
  const lookup = useMemo(() => regionLookup(regions), [regions]);
  const rainbow = regions?.kind === "rainbow";
  const borders = useMemo(
    () => regionBorderClasses(rainbow ? boxOf : lookup, SIZE, SIZE),
    [rainbow, lookup],
  );
  const cageLookup = useMemo(() => lookupCages(cages), [cages]);
  const annotation = useMemo(() => {
    if (!rainbow && !cages?.length) return undefined;
    return (row: number, col: number) => {
      const letter = rainbow ? GROUP_LETTERS[lookup(row, col) ?? 0] : undefined;
      const cage = cages?.[cageLookup.cageAt(row, col) ?? -1];
      const anchored = cageLookup.anchoredAt(row, col);
      const labels = [
        letter && `colour group ${letter}`,
        anchored
          ? `cage of ${anchored.cells.length} ${plural(anchored.cells.length)} adding up to ${anchored.sum}`
          : cage && `in the cage adding up to ${cage.sum}`,
      ].filter(Boolean);
      if (!labels.length) return undefined;
      return {
        content:
          [letter, anchored?.sum].filter(Boolean).join(" ") || null,
        label: labels.join(", "),
      };
    };
  }, [rainbow, cages, lookup, cageLookup]);
  const cellClassName = useMemo(
    () =>
      rainbow
        ? (row: number, col: number) =>
            `${borders(row, col)} ${GROUP_BACKGROUNDS[lookup(row, col) ?? 0]}`
        : borders,
    [rainbow, borders, lookup],
  );
  const outline = (row: number, col: number) => {
    const sides = cageLookup.sidesOf(row, col);
    return sides && <CageOutline sides={sides} />;
  };
  const edges = useMemo(() => {
    if (!xv) return undefined;
    const byCell = new Map<CellKey, CellEdges>();
    for (const { row, col, direction, mark } of xv.marks) {
      const key = cellKey(row, col);
      byCell.set(key, { ...byCell.get(key), [direction]: MARKS[direction][mark] });
    }
    return (row: number, col: number) => byCell.get(cellKey(row, col));
  }, [xv]);

  const kinds = [
    regions && (regions.kind === "jigsaw" ? "Jigsaw" : "Rainbow"),
    cages?.length && "Killer",
    xv && "XV",
  ].filter(Boolean);

  return (
    <DigitGrid
      label={kinds.length ? `${kinds.join(" ")} sudoku` : "Sudoku"}
      size={SIZE}
      givens={payload.givens}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
      wrongCells={wrongParts}
      cellClassName={cellClassName}
      annotation={annotation}
      underlay={cages?.length ? outline : undefined}
      edges={edges}
      instructions={`${
        regions?.kind === "jigsaw"
          ? "Each thick-bordered region holds 1 to 9 once, as do rows and columns. "
          : regions?.kind === "rainbow"
            ? "Each box, row, column and lettered colour group holds 1 to 9 once. "
            : ""
      }${
        cages?.length
          ? "Dashed cages add up to the sum in the corner of their first cell, and no digit repeats within a cage. Each cell is read out with the cage it belongs to. "
          : ""
      }${
        xv
          ? "An X between two cells means they add up to 10, and a V means 5. Two neighbouring cells with no mark never add up to 5 or 10. Marks are read out with both cells. "
          : ""
      }Type 1 to 9 to fill a cell and Backspace to clear it. Press N to switch notes on or off. Arrow keys move between cells. The grid is checked when every cell is filled.`}
    />
  );
}
