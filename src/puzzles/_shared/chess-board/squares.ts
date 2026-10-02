import type { Payload } from "@/puzzles/reverse-chess/schema";

export type PieceRow = Payload["pieces"][number];
export type PieceKind = PieceRow["piece"];
export type Colour = PieceRow["colour"];
export type Square = `${PieceRow["file"]}${number}`;

export type RetroDrop = { from: Square; to: Square };
export type BackwardsArrow = RetroDrop;

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const CODE_BY_PIECE = {
  pawn: "P",
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",
} as const satisfies Record<PieceKind, string>;

export function pieceCode(colour: Colour, piece: PieceKind) {
  return `${colour === "white" ? "w" : "b"}${CODE_BY_PIECE[piece]}`;
}

export function toPositionData(pieces: readonly PieceRow[]) {
  return Object.fromEntries(
    pieces.map(({ file, rank, colour, piece }) => [
      `${file}${rank}`,
      { pieceType: pieceCode(colour, piece) },
    ]),
  );
}

export function squareName(fileIndex: number, rank: number): Square {
  return `${FILES[fileIndex]}${rank}` as Square;
}

export function fileIndexOf(square: Square) {
  return FILES.indexOf(square[0] as (typeof FILES)[number]);
}

/** Moves a square by screen direction, clamped to the board, honouring orientation. */
export function stepSquare(
  square: Square,
  direction: "up" | "down" | "left" | "right",
  orientation: Colour,
): Square {
  const flip = orientation === "white" ? 1 : -1;
  const rank = Number(square[1]);
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "up" ? 1 : direction === "down" ? -1 : 0;
  const clamp = (value: number) => Math.min(7, Math.max(0, value));
  return squareName(
    clamp(fileIndexOf(square) + dx * flip),
    clamp(rank - 1 + dy * flip) + 1,
  );
}

/** A piece dragged from `source` to `target` reports the forward move that would have led to the position. */
export function retroDrop(source: Square, target: Square): RetroDrop {
  return { from: target, to: source };
}
