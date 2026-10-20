import { z } from "zod";
import type { chessColourEnum, chessFileEnum, chessPieceEnum } from "@/db/schema/core";

type Piece = {
  file: (typeof chessFileEnum.enumValues)[number];
  rank: number;
  colour: (typeof chessColourEnum.enumValues)[number];
  piece: (typeof chessPieceEnum.enumValues)[number];
};

export type Position = {
  sideToMove: Piece["colour"];
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
  enPassantFile: Piece["file"] | null;
  halfmove: number;
  fullmove: number;
  pieces: Piece[];
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export const LETTER_BY_PIECE = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
} as const satisfies Record<Piece["piece"], string>;

const PIECE_BY_LETTER = Object.fromEntries(
  Object.entries(LETTER_BY_PIECE).map(([piece, letter]) => [letter, piece]),
) as Record<string, Piece["piece"]>;

/** Builds the FEN that chess.js loads from piece rows and scalar columns. Castling is always in `KQkq` order. */
export function toFen(position: Position) {
  const squares = new Map(
    position.pieces.map((piece) => [`${piece.file}${piece.rank}`, piece]),
  );

  const placement = [8, 7, 6, 5, 4, 3, 2, 1]
    .map((rank) => {
      let row = "";
      let empty = 0;
      for (const file of FILES) {
        const piece = squares.get(`${file}${rank}`);
        if (!piece) {
          empty += 1;
          continue;
        }
        if (empty) row += empty;
        empty = 0;
        const letter = LETTER_BY_PIECE[piece.piece];
        row += piece.colour === "white" ? letter.toUpperCase() : letter;
      }
      return row + (empty || "");
    })
    .join("/");

  const castling =
    [
      position.whiteKingside && "K",
      position.whiteQueenside && "Q",
      position.blackKingside && "k",
      position.blackQueenside && "q",
    ]
      .filter(Boolean)
      .join("") || "-";

  const enPassant = position.enPassantFile
    ? `${position.enPassantFile}${position.sideToMove === "white" ? 6 : 3}`
    : "-";

  return [
    placement,
    position.sideToMove === "white" ? "w" : "b",
    castling,
    enPassant,
    position.halfmove,
    position.fullmove,
  ].join(" ");
}

/** Inverse of `toFen`: parses content FEN and positions the solvers display. */
export function fromFen(fen: string): Position {
  const [placement, side, castling, enPassant, halfmove, fullmove] =
    fen.split(" ");

  const pieces = placement.split("/").flatMap((row, rowIndex) => {
    const found: Piece[] = [];
    let fileIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
        continue;
      }
      found.push({
        file: FILES[fileIndex],
        rank: 8 - rowIndex,
        colour: char === char.toUpperCase() ? "white" : "black",
        piece: PIECE_BY_LETTER[char.toLowerCase()],
      });
      fileIndex += 1;
    }
    return found;
  });

  return {
    sideToMove: side === "w" ? "white" : "black",
    whiteKingside: castling.includes("K"),
    whiteQueenside: castling.includes("Q"),
    blackKingside: castling.includes("k"),
    blackQueenside: castling.includes("q"),
    enPassantFile:
      enPassant === "-" ? null : (enPassant[0] as Position["enPassantFile"]),
    halfmove: Number(halfmove),
    fullmove: Number(fullmove),
    pieces,
  };
}

const PLACEMENT_ROW = /^(?:[pnbrqkPNBRQK1-8])+$/;

function isFen(fen: string) {
  const fields = fen.split(" ");
  if (fields.length !== 6) return false;
  const [placement, side, castling, enPassant, halfmove, fullmove] = fields;
  const rows = placement.split("/");
  return (
    rows.length === 8 &&
    rows.every(
      (row) =>
        PLACEMENT_ROW.test(row) &&
        [...row].reduce(
          (width, char) => width + (/\d/.test(char) ? Number(char) : 1),
          0,
        ) === 8,
    ) &&
    /^[wb]$/.test(side) &&
    /^(?:-|K?Q?k?q?)$/.test(castling) &&
    /^(?:-|[a-h][36])$/.test(enPassant) &&
    /^\d+$/.test(halfmove) &&
    /^[1-9]\d*$/.test(fullmove)
  );
}

/** A FEN string as authored in content, parsed into the piece rows and scalar columns the tables hold. */
export const fenSchema = z
  .string()
  .refine(isFen, { message: "not a well-formed FEN" })
  .transform(fromFen);
