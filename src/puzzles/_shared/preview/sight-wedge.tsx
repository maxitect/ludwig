import { polar } from "../cog-path";
import { cellCentre } from "./mini-grid";

const BEARING = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315,
} as const;

/** An observer's field of view on a `MiniGrid`: an outlined wedge, or a circle at 360 degrees. Reach is in grid units. */
export function SightWedge({
  row,
  col,
  facing,
  fovDeg,
  reach,
}: {
  row: number;
  col: number;
  facing: keyof typeof BEARING;
  fovDeg: number;
  reach: number;
}) {
  const x = cellCentre(col);
  const y = cellCentre(row);
  if (fovDeg >= 360) {
    return (
      <circle
        cx={x}
        cy={y}
        r={reach}
        className="fill-none stroke-ludwig-red"
        strokeWidth={0.8}
      />
    );
  }
  const [ax, ay] = polar(BEARING[facing] - fovDeg / 2, reach);
  const [bx, by] = polar(BEARING[facing] + fovDeg / 2, reach);
  return (
    <path
      d={`M${x} ${y}l${ax} ${ay}A${reach} ${reach} 0 ${fovDeg > 180 ? 1 : 0} 1 ${x + bx} ${y + by}Z`}
      className="fill-none stroke-ludwig-red"
      strokeWidth={0.8}
    />
  );
}
