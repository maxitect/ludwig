import { CELL, cellCentre, MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

const SIGNS = {
  right: { lt: "<", gt: ">" },
  down: { lt: "^", gt: "v" },
} as const;

export function Preview({
  payload: { size, givens, inequalities },
}: {
  payload: Payload;
}) {
  return (
    <MiniGrid
      rows={size}
      cols={size}
      labels={givens.map(({ row, col, digit }) => ({
        row,
        col,
        text: String(digit),
      }))}
    >
      {inequalities.map(({ row, col, direction, relation }) => (
        <text
          key={`${row}-${col}-${direction}`}
          x={direction === "right" ? (col + 1) * CELL : cellCentre(col)}
          y={direction === "right" ? cellCentre(row) : (row + 1) * CELL}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={7}
          strokeWidth={2.4}
          paintOrder="stroke"
          className="fill-ludwig-red stroke-paper font-mono font-bold"
        >
          {SIGNS[direction][relation]}
        </text>
      ))}
    </MiniGrid>
  );
}
