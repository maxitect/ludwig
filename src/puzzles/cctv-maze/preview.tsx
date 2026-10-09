import { MiniGrid } from "../_shared/preview/mini-grid";
import { cellCentre, SightWedge } from "../_shared/preview/sight-wedge";
import type { Payload } from "./schema";

const CELL = 10;

export function Preview({
  payload: {
    rows,
    cols,
    startRow,
    startCol,
    exitRow,
    exitCol,
    walls,
    cameras,
  },
}: {
  payload: Payload;
}) {
  return (
    <MiniGrid rows={rows} cols={cols}>
      <path
        d={walls
          .map(({ row, col, side }) =>
            side === "north"
              ? `M${col * CELL} ${row * CELL}h${CELL}`
              : `M${col * CELL} ${row * CELL}v${CELL}`,
          )
          .join("")}
        className="fill-none stroke-ink"
        strokeWidth={1.8}
      />
      {cameras.map(({ rangeCells, ...camera }) => (
        <SightWedge
          key={`${camera.row}-${camera.col}`}
          {...camera}
          reach={rangeCells * CELL}
        />
      ))}
      {cameras.map(({ row, col }) => (
        <circle
          key={`camera-${row}-${col}`}
          cx={cellCentre(col)}
          cy={cellCentre(row)}
          r={2.2}
          className="fill-ludwig-red"
        />
      ))}
      <circle
        cx={cellCentre(startCol)}
        cy={cellCentre(startRow)}
        r={3.2}
        className="fill-ink"
      />
      <rect
        x={exitCol * CELL + 2}
        y={exitRow * CELL + 2}
        width={6}
        height={6}
        className="fill-paper stroke-ludwig-red"
        strokeWidth={1.2}
      />
    </MiniGrid>
  );
}
