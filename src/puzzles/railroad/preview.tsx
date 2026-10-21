import { CELL, MiniGrid, cellCentre } from "../_shared/preview/mini-grid";
import { OPEN, STEP } from "./engine";
import type { Payload, Side } from "./schema";

const HALF = CELL / 2;

/** The point on the grid's edge where an end's light sits. */
const lightAt = ({
  row,
  col,
  side,
}: {
  row: number;
  col: number;
  side: Side;
}) => ({
  x: cellCentre(col) + STEP[side][1] * HALF,
  y: cellCentre(row) + STEP[side][0] * HALF,
});

/** A stub from the cell's centre to one side, so a given piece reads as track. */
const arm = (row: number, col: number, side: Side) =>
  `M${cellCentre(col)} ${cellCentre(row)}l${STEP[side][1] * HALF} ${STEP[side][0] * HALF}`;

export function Preview({ payload }: { payload: Payload }) {
  const { rows, cols, entry, exit, given } = payload;
  const start = lightAt(entry);
  const end = lightAt(exit);
  return (
    <MiniGrid rows={rows} cols={cols}>
      <path
        d={given
          .flatMap(({ row, col, piece }) =>
            OPEN[piece].map((side) => arm(row, col, side)),
          )
          .join("")}
        className="fill-none stroke-ink"
        strokeWidth={1.6}
      />
      <circle cx={start.x} cy={start.y} r={2} className="fill-ink" />
      <rect
        x={end.x - 2}
        y={end.y - 2}
        width={4}
        height={4}
        className="fill-ludwig-red"
      />
    </MiniGrid>
  );
}
