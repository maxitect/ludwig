"use client";

import { useMemo } from "react";
import { cellKey, type CellEdges, type CellKey } from "../_shared/cell-grid";
import { DigitGrid } from "../_shared/digit-grid";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const SIGNS = {
  right: {
    lt: {
      content: "<",
      label: "less than the cell to the right",
      neighbourLabel: "greater than the cell to the left",
    },
    gt: {
      content: ">",
      label: "greater than the cell to the right",
      neighbourLabel: "less than the cell to the left",
    },
  },
  down: {
    lt: {
      content: <span className="rotate-90">{"<"}</span>,
      label: "less than the cell below",
      neighbourLabel: "greater than the cell above",
    },
    gt: {
      content: <span className="rotate-90">{">"}</span>,
      label: "greater than the cell below",
      neighbourLabel: "less than the cell above",
    },
  },
} as const;

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const { size } = payload;
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

  return (
    <DigitGrid
      label="Futoshiki"
      size={size}
      givens={payload.givens}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
      cellRem={5}
      edges={(row, col) => signs.get(cellKey(row, col))}
      instructions={`Type 1 to ${size} to fill a cell and Backspace to clear it. Press N to switch notes on or off. Arrow keys move between cells. Signs between cells say which of the two is smaller, and are read out with both cells. The grid is checked when every cell is filled.`}
    />
  );
}
