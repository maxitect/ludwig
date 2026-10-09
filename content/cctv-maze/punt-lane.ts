import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/cctv-maze/schema";

export const meta = {
  slug: "punt-lane",
  title: "Punt Lane",
  difficulty: 1,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  startRow: 4,
  startCol: 0,
  exitRow: 1,
  exitCol: 5,
  walls: [
    { row: 1, col: 0, side: "north" },
    { row: 1, col: 1, side: "west" },
    { row: 1, col: 1, side: "north" },
    { row: 1, col: 2, side: "north" },
    { row: 1, col: 3, side: "north" },
    { row: 1, col: 5, side: "west" },
    { row: 2, col: 2, side: "west" },
    { row: 2, col: 2, side: "north" },
    { row: 2, col: 3, side: "north" },
    { row: 2, col: 4, side: "north" },
    { row: 3, col: 1, side: "north" },
    { row: 3, col: 3, side: "north" },
    { row: 3, col: 4, side: "north" },
    { row: 3, col: 5, side: "west" },
    { row: 4, col: 1, side: "north" },
    { row: 4, col: 2, side: "north" },
    { row: 4, col: 3, side: "west" },
    { row: 4, col: 3, side: "north" },
    { row: 4, col: 5, side: "west" },
    { row: 5, col: 0, side: "north" },
    { row: 5, col: 1, side: "north" },
    { row: 5, col: 3, side: "north" },
  ],
  cameras: [
    { row: 5, col: 2, facing: "ne", fovDeg: 60, rangeCells: 2 },
    { row: 0, col: 5, facing: "ne", fovDeg: 120, rangeCells: 3 },
    { row: 0, col: 4, facing: "sw", fovDeg: 90, rangeCells: 2 },
  ],
} satisfies Content;
