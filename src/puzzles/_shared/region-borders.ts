import { cn } from "@/utils/cn";

/** The region a cell belongs to, or undefined off the grid. */
export type RegionOf = (row: number, col: number) => number | undefined;

/** Thick rules on the right and lower edges that separate two regions, for cells of a `CellGrid`. */
export function regionBorderClasses(
  regionOf: RegionOf,
  rows: number,
  cols: number,
) {
  return (row: number, col: number) =>
    cn(
      col < cols - 1 &&
        regionOf(row, col) !== regionOf(row, col + 1) &&
        "border-r-2 border-ink",
      row < rows - 1 &&
        regionOf(row, col) !== regionOf(row + 1, col) &&
        "border-b-2 border-ink",
    );
}

type Segment = { x1: number; y1: number; x2: number; y2: number };

/** The grid-unit line segments between two regions, for an SVG overlay. */
export function regionSegments(regionOf: RegionOf, rows: number, cols: number) {
  const segments: Segment[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (col < cols - 1 && regionOf(row, col) !== regionOf(row, col + 1)) {
        segments.push({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 });
      }
      if (row < rows - 1 && regionOf(row, col) !== regionOf(row + 1, col)) {
        segments.push({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 });
      }
    }
  }
  return segments;
}
