import type { Board } from "./engine";
import type { Content } from "./schema";

/**
 * A 7 by 9 board. The two bolts rule out the short chain along the driver's row, so the only
 * anticlockwise placement is the chain of four cogs along row 5.
 */
export const planted = {
  rows: 7,
  cols: 9,
  targetClockwise: false,
  driver: { row: 3, col: 1, teeth: 8 },
  target: { row: 3, col: 7, teeth: 8 },
  bolts: [
    { row: 2, col: 3 },
    { row: 2, col: 5 },
  ],
  inventory: [{ teeth: 8, count: 4 }],
} satisfies Board;

export const plantedSolution = [
  { row: 5, col: 1, teeth: 8 },
  { row: 5, col: 3, teeth: 8 },
  { row: 5, col: 5, teeth: 8 },
  { row: 5, col: 7, teeth: 8 },
] satisfies Content["solution"];

export const plantedContent = {
  ...planted,
  solution: plantedSolution,
} satisfies Content;

/** Every chain of an even number of cogs turns the target anticlockwise, so clockwise has no answer. */
export const contradictory = {
  ...planted,
  targetClockwise: true,
} satisfies Board;

/** A 3-4-5 triangle of cogs (16, 24 and the 8-tooth driver) with the target meshing the 24. */
export const triangle = {
  rows: 12,
  cols: 12,
  targetClockwise: true,
  driver: { row: 4, col: 6, teeth: 8 },
  target: { row: 8, col: 10, teeth: 8 },
  bolts: [],
  inventory: [
    { teeth: 16, count: 1 },
    { teeth: 24, count: 1 },
  ],
} satisfies Board;

export const triangleCogs = [
  { row: 4, col: 3, teeth: 16 },
  { row: 8, col: 6, teeth: 24 },
] satisfies Content["solution"];
