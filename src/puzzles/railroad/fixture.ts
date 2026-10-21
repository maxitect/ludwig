import type { Payload, Placed } from "./schema";

/**
 * A 4 by 4 puzzle whose one track runs along the top, down the third column, across to the
 * fourth and down to the exit.
 */
export const payload: Payload = {
  rows: 4,
  cols: 4,
  entry: { row: 0, col: 0, side: "w" },
  exit: { row: 3, col: 3, side: "e" },
  rowCounts: [3, 1, 2, 1],
  colCounts: [1, 1, 3, 2],
  given: [{ row: 1, col: 2, piece: "ns" }],
};

export const track: Placed[] = [
  { row: 0, col: 0, piece: "ew" },
  { row: 0, col: 1, piece: "ew" },
  { row: 0, col: 2, piece: "sw" },
  { row: 1, col: 2, piece: "ns" },
  { row: 2, col: 2, piece: "ne" },
  { row: 2, col: 3, piece: "sw" },
  { row: 3, col: 3, piece: "ne" },
];

/** A closed ring in the free corner: it matches no count of the puzzle above, but it is a loop. */
export const loop: Placed[] = [
  { row: 2, col: 0, piece: "se" },
  { row: 2, col: 1, piece: "sw" },
  { row: 3, col: 0, piece: "ne" },
  { row: 3, col: 1, piece: "nw" },
];

/** A straight run along the top with a ring below it: its counts are the track's plus the ring's. */
export const withLoop: Payload = {
  rows: 4,
  cols: 4,
  entry: { row: 0, col: 0, side: "w" },
  exit: { row: 0, col: 3, side: "e" },
  rowCounts: [4, 0, 2, 2],
  colCounts: [3, 3, 1, 1],
  given: [],
};

export const straightTop: Placed[] = [0, 1, 2, 3].map((col) => ({
  row: 0,
  col,
  piece: "ew",
}));
