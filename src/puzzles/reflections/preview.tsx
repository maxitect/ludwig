import { CELL, MiniGrid, cellCentre } from "../_shared/preview/mini-grid";
import type { Mirror, Payload } from "./schema";

const GAP = CELL * 0.2;

const diagonal = (row: number, col: number, mirror: Mirror) => {
  const [x0, x1] = [col * CELL + GAP, (col + 1) * CELL - GAP];
  const [y0, y1] = [row * CELL + GAP, (row + 1) * CELL - GAP];
  return mirror === "slash"
    ? `M${x0} ${y1}L${x1} ${y0}`
    : `M${x0} ${y0}L${x1} ${y1}`;
};

/** The centre of the cell a port opens onto, pushed out to the grid's edge. */
const portAt = (
  { side, offset }: Payload["ports"][number],
  rows: number,
  cols: number,
) => {
  switch (side) {
    case "n":
      return { x: cellCentre(offset), y: 0 };
    case "s":
      return { x: cellCentre(offset), y: rows * CELL };
    case "w":
      return { x: 0, y: cellCentre(offset) };
    case "e":
      return { x: cols * CELL, y: cellCentre(offset) };
  }
};

export function Preview({ payload }: { payload: Payload }) {
  const { rows, cols, fixedMirrors, slots, ports } = payload;
  return (
    <MiniGrid
      rows={rows}
      cols={cols}
      tints={
        <path
          d={slots
            .map(
              ({ row, col }) =>
                `M${col * CELL + GAP} ${row * CELL + GAP}h${CELL - 2 * GAP}v${CELL - 2 * GAP}h-${CELL - 2 * GAP}z`,
            )
            .join("")}
          className="fill-paper-shade"
        />
      }
    >
      <path
        d={fixedMirrors
          .map(({ row, col, mirror }) => diagonal(row, col, mirror))
          .join("")}
        className="fill-none stroke-ink"
        strokeWidth={1.6}
      />
      {ports.map((port) => {
        const { x, y } = portAt(port, rows, cols);
        return (
          <circle
            key={`${port.side}${port.offset}`}
            cx={x}
            cy={y}
            r={2}
            className="fill-ludwig-red"
          />
        );
      })}
    </MiniGrid>
  );
}
