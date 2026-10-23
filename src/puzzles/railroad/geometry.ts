import type { Piece, Side } from "./schema";

export const SIDES: readonly Side[] = ["n", "e", "s", "w"];

export const OPEN: Readonly<Record<Piece, readonly [Side, Side]>> = {
  ns: ["n", "s"],
  ew: ["e", "w"],
  ne: ["n", "e"],
  nw: ["n", "w"],
  se: ["s", "e"],
  sw: ["s", "w"],
};

export const STEP: Readonly<Record<Side, readonly [number, number]>> = {
  n: [-1, 0],
  e: [0, 1],
  s: [1, 0],
  w: [0, -1],
};

export const OPPOSITE: Readonly<Record<Side, Side>> = {
  n: "s",
  e: "w",
  s: "n",
  w: "e",
};

const PIECE_OF: Readonly<Record<string, Piece>> = Object.fromEntries(
  (Object.entries(OPEN) as [Piece, readonly [Side, Side]][]).flatMap(
    ([piece, [a, b]]) => [
      [a + b, piece],
      [b + a, piece],
    ],
  ),
);

/** The piece that joins two different sides. */
export const pieceJoining = (a: Side, b: Side) => PIECE_OF[a + b];

/** The side of a piece that is not `side`, or undefined when the piece does not open onto `side`. */
export function otherSide(piece: Piece, side: Side) {
  const [a, b] = OPEN[piece];
  if (side === a) return b;
  return side === b ? a : undefined;
}
