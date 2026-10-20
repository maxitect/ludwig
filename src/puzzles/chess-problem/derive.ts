import { toFen as positionFen } from "../_shared/chess-fen";
import type { MoveInput } from "./engine";
import type { AttemptPly, Payload } from "./schema";

type Position = Pick<
  Payload,
  | "whiteKingside"
  | "whiteQueenside"
  | "blackKingside"
  | "blackQueenside"
  | "enPassantFile"
  | "pieces"
>;

/** The FEN chess.js loads. White is always to move, and the move clocks are fixed because no rule here depends on them. */
export const toFen = (position: Position) =>
  positionFen({
    ...position,
    sideToMove: "white",
    halfmove: 0,
    fullmove: 1,
  });

const PROMOTION_LETTER = {
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
} as const;

const PROMOTION_PIECE = {
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
} as const;

export function plyToMove(ply: AttemptPly): MoveInput {
  const promotion = ply.promotion
    ? PROMOTION_LETTER[ply.promotion as keyof typeof PROMOTION_LETTER]
    : undefined;
  return {
    from: `${ply.fromFile}${ply.fromRank}`,
    to: `${ply.toFile}${ply.toRank}`,
    promotion,
  };
}

export function moveToPly(move: MoveInput): AttemptPly {
  return {
    fromFile: move.from[0] as AttemptPly["fromFile"],
    fromRank: Number(move.from[1]),
    toFile: move.to[0] as AttemptPly["toFile"],
    toRank: Number(move.to[1]),
    promotion: move.promotion
      ? PROMOTION_PIECE[move.promotion as keyof typeof PROMOTION_PIECE]
      : null,
  };
}

/** The labels of a line in Alan Connor's format: A for White's key move, B for Black's reply, C for White's mate. */
export const plyLabel = (index: number) => String.fromCharCode(65 + index);
