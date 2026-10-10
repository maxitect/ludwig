import {
  FILES,
  type Colour,
  type PieceKind,
  type Square,
} from "@/puzzles/_shared/chess-board/squares";

export type WallPiece = {
  colour: Colour;
  piece: PieceKind;
  square: Square;
};

const BACK_RANK = [
  ["a", "rook"],
  ["b", "knight"],
  ["c", "bishop"],
  ["e", "king"],
  ["f", "bishop"],
  ["g", "knight"],
  ["h", "rook"],
] as const;

const PAWN_FILES = ["a", "b", "c", "e", "f", "g", "h"] as const;

/** Ranks 8 to 3 after 1.e4 d5 2.exd5 Qxd5: only black remains, queen on d5. */
export const WALL_START: readonly WallPiece[] = [
  ...BACK_RANK.map(
    ([file, piece]): WallPiece => ({
      colour: "black",
      piece,
      square: `${file}8` as Square,
    }),
  ),
  ...PAWN_FILES.map(
    (file): WallPiece => ({
      colour: "black",
      piece: "pawn",
      square: `${file}7` as Square,
    }),
  ),
  { colour: "black", piece: "queen", square: "d5" },
];

export type WallUnMove = WallPiece & {
  id: "queen" | "white-pawn" | "black-pawn";
  to: Square;
};

/** The game played backwards: un-Qxd5, un-exd5, un-d5. Each piece starts on d5. */
export const WALL_UN_MOVES: readonly WallUnMove[] = [
  { id: "queen", colour: "black", piece: "queen", square: "d5", to: "d8" },
  { id: "white-pawn", colour: "white", piece: "pawn", square: "d5", to: "e4" },
  { id: "black-pawn", colour: "black", piece: "pawn", square: "d5", to: "d7" },
];

const E_FILE = FILES.indexOf("e");

/** Cell offsets from the centred e-file (columns) and the top of the wall (rows, rank 8 = 0). */
export function wallCell(square: Square) {
  return {
    col: FILES.indexOf(square[0] as (typeof FILES)[number]) - E_FILE,
    row: 8 - Number(square[1]),
  };
}
