import { Chess } from "chess.js";
import { toFen as positionFen } from "../_shared/chess-fen";
import { toFen } from "./derive";
import { keyMoves } from "./engine";
import type { Content } from "./schema";

const CASTLING_SQUARES = [
  ["whiteKingside", "white", "e1", "h1"],
  ["whiteQueenside", "white", "e1", "a1"],
  ["blackKingside", "black", "e8", "h8"],
  ["blackQueenside", "black", "e8", "a8"],
] as const;

type Piece = Content["pieces"][number];

/** Throws when a castling right or the en passant file contradicts the pieces. */
function checkRights(content: Content) {
  const at = (square: string) =>
    content.pieces.find(({ file, rank }) => `${file}${rank}` === square);
  const holds = (square: string, colour: Piece["colour"], piece: Piece["piece"]) =>
    at(square)?.colour === colour && at(square)?.piece === piece;

  for (const [right, colour, king, rook] of CASTLING_SQUARES) {
    if (content[right] && !(holds(king, colour, "king") && holds(rook, colour, "rook"))) {
      throw new Error(`illegal position: ${right} castling without the king on ${king} and the rook on ${rook}`);
    }
  }
  const file = content.enPassantFile;
  if (file && !(holds(`${file}5`, "black", "pawn") && !at(`${file}6`) && !at(`${file}7`))) {
    throw new Error(`illegal position: no Black pawn can just have moved two squares to ${file}5 for en passant`);
  }
}

/** Throws unless the position is legal, has no mate in fewer moves than `mateIn`, and has exactly one key move. */
export function verifyChessProblem(content: Content) {
  const fen = toFen(content);
  const { pieces, mateIn } = content;

  if (pieces.some(({ piece, rank }) => piece === "pawn" && (rank === 1 || rank === 8))) {
    throw new Error("a pawn stands on the first or last rank");
  }
  checkRights(content);
  try {
    new Chess(fen);
  } catch (error) {
    throw new Error(`illegal position: ${(error as Error).message}`);
  }
  const blackToMove = positionFen({
    ...content,
    sideToMove: "black",
    enPassantFile: null,
    halfmove: 0,
    fullmove: 1,
  });
  if (new Chess(blackToMove).isCheck()) {
    throw new Error("illegal position: Black is in check with White to move");
  }

  for (let shorter = 1; shorter < mateIn; shorter++) {
    const quicker = keyMoves(fen, shorter);
    if (quicker.length > 0) {
      throw new Error(
        `White mates in ${shorter} (${quicker.map((move) => move.san).join(", ")}), not in ${mateIn}`,
      );
    }
  }
  const keys = keyMoves(fen, mateIn);
  if (keys.length !== 1) {
    throw new Error(
      `expected exactly 1 key move, found ${keys.length}${keys.length ? `: ${keys.map((move) => move.san).join(", ")}` : ""}`,
    );
  }
}
