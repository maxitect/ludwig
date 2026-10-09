import { MiniGrid } from "../_shared/preview/mini-grid";
import { cellCentre, SightWedge } from "../_shared/preview/sight-wedge";
import type { Payload } from "./schema";

const REACH = 22;

export function Preview({
  payload: { rows, cols, targetRow, targetCol, obstacles, observers },
}: {
  payload: Payload;
}) {
  return (
    <MiniGrid rows={rows} cols={cols}>
      <path
        d={obstacles
          .map(({ row, col }) => `M${col * 10} ${row * 10}h10v10h-10z`)
          .join("")}
        className="fill-ink"
      />
      {observers.map((observer) => (
        <SightWedge
          key={`${observer.row}-${observer.col}`}
          {...observer}
          reach={REACH}
        />
      ))}
      {observers.map(({ row, col }) => (
        <circle
          key={`dot-${row}-${col}`}
          cx={cellCentre(col)}
          cy={cellCentre(row)}
          r={2.2}
          className="fill-ink"
        />
      ))}
      <circle
        cx={cellCentre(targetCol)}
        cy={cellCentre(targetRow)}
        r={3.4}
        className="fill-ludwig-red stroke-ink"
        strokeWidth={0.8}
      />
    </MiniGrid>
  );
}
