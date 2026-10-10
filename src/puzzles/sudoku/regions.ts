import type { RegionOf } from "../_shared/region-borders";
import type { Regions } from "./schema";

const SIZE = 9;

export const boxOf: RegionOf = (row, col) =>
  Math.floor(row / 3) * 3 + Math.floor(col / 3);

/** Looks up each cell's region, or its box when the puzzle has no region set. */
export function regionLookup(regions?: Regions): RegionOf {
  if (!regions) return boxOf;
  const table = new Map(
    regions.cells.map(({ row, col, region }) => [row * SIZE + col, region]),
  );
  return (row, col) => table.get(row * SIZE + col);
}

export const GROUP_LETTERS = "ABCDEFGHI";

export const GROUP_BACKGROUNDS = [
  "bg-rainbow-1",
  "bg-rainbow-2",
  "bg-rainbow-3",
  "bg-rainbow-4",
  "bg-rainbow-5",
  "bg-rainbow-6",
  "bg-rainbow-7",
  "bg-rainbow-8",
  "bg-rainbow-9",
];

export const GROUP_FILLS = [
  "fill-rainbow-1",
  "fill-rainbow-2",
  "fill-rainbow-3",
  "fill-rainbow-4",
  "fill-rainbow-5",
  "fill-rainbow-6",
  "fill-rainbow-7",
  "fill-rainbow-8",
  "fill-rainbow-9",
];
