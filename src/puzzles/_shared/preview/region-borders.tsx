import { regionSegments, type RegionOf } from "../region-borders";
import { CELL } from "./mini-grid";

/** Thick lines between regions, drawn over a `MiniGrid`. */
export function RegionBorders({
  regionOf,
  rows,
  cols,
}: {
  regionOf: RegionOf;
  rows: number;
  cols: number;
}) {
  return (
    <path
      d={regionSegments(regionOf, rows, cols)
        .map(
          ({ x1, y1, x2, y2 }) =>
            `M${x1 * CELL} ${y1 * CELL}L${x2 * CELL} ${y2 * CELL}`,
        )
        .join("")}
      className="fill-none stroke-ink"
      strokeWidth={1.6}
    />
  );
}
