import { Chess, DEFAULT_POSITION } from "chess.js";
import type { Move } from "chess.js";
import type { PositionGoal } from "./schema";
import { fromFen } from "../_shared/chess-fen";

export { LETTER_BY_PIECE, fromFen, toFen, type Position } from "../_shared/chess-fen";

/** True when the position described by `fen` satisfies the Mode B goal. */
export function satisfiesGoal(fen: string, goal: PositionGoal) {
  const position = fromFen(fen);
  if (goal.kind === "piece_on_square") {
    return position.pieces.some(
      (piece) =>
        piece.file === goal.file &&
        piece.rank === goal.rank &&
        piece.colour === goal.colour &&
        piece.piece === goal.piece,
    );
  }
  if (goal.kind === "castling_right") {
    const rights = {
      white: {
        kingside: position.whiteKingside,
        queenside: position.whiteQueenside,
      },
      black: {
        kingside: position.blackKingside,
        queenside: position.blackQueenside,
      },
    };
    return rights[goal.colour][goal.side];
  }
  return (
    position.pieces.filter(
      (piece) => piece.colour === goal.colour && piece.piece === goal.piece,
    ).length === goal.count
  );
}

export type ForwardMove = Pick<Move, "from" | "to" | "promotion">;

/** The forward move that a retro move takes back: `position` is the one shown, with the promoted piece still on `to`. */
export function toForward(
  retro: Pick<Move, "from" | "to"> & { unpromote?: boolean },
  position: string,
): ForwardMove {
  return {
    from: retro.from,
    to: retro.to,
    promotion: retro.unpromote ? new Chess(position).get(retro.to)?.type : undefined,
  };
}

const fenKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

/** True when `moves`, legal from the standard starting position, end exactly at `fen`: placement, side to move, castling rights and en passant square. */
export function reproducesFromStart(moves: readonly ForwardMove[], fen: string) {
  const chess = new Chess();
  try {
    for (const move of moves) chess.move(move);
  } catch {
    return false;
  }
  return fenKey(chess.fen()) === fenKey(fen);
}

/** True when `fen` has the standard starting placement and White to move. */
export const isStartingPlacement = (fen: string) =>
  fen.split(" ").slice(0, 2).join(" ") ===
  DEFAULT_POSITION.split(" ").slice(0, 2).join(" ");

function forwardMove(prior: string, { from, to, promotion }: ForwardMove) {
  const moves = new Chess(prior).moves({ verbose: true });
  const found = moves.find(
    (move) =>
      move.from === from && move.to === to && move.promotion === promotion,
  );
  if (!found) throw new Error(`${from}${to} is not a legal move in ${prior}`);
  return { found, moves };
}

/** Standard algebraic notation of the forward move played from `prior`, without check or mate marks. */
export function toAlgebraic(move: ForwardMove, prior: string) {
  return forwardMove(prior, move).found.san.replace(/[+#]$/, "");
}

const DESCRIPTIVE_FILES = {
  a: "QR",
  b: "QN",
  c: "QB",
  d: "Q",
  e: "K",
  f: "KB",
  g: "KN",
  h: "KR",
} as const;

const descriptiveSquare = (square: string, colour: Move["color"]) =>
  `${DESCRIPTIVE_FILES[square[0] as keyof typeof DESCRIPTIVE_FILES]}${colour === "w" ? square[1] : 9 - Number(square[1])}`;

function descriptiveRest(move: Move) {
  const target = move.captured
    ? `x${move.captured.toUpperCase()}`
    : `-${descriptiveSquare(move.to, move.color)}`;
  const promotion = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  return `${target}${promotion}`;
}

/**
 * Descriptive notation of the forward move played from `prior`. Each side names squares from its own view:
 * files take the name of the piece that starts on them (QR, QN, QB, Q, K, KB, KN, KR) and ranks count from the mover's back rank.
 * Quiet moves read `N-KB3`, captures name the captured piece (`PxP`), promotions end `=Q`, castling is `O-O` or `O-O-O`.
 * When another legal move by the same kind of piece would read identically, the origin square follows the piece, as in `R(KR1)-Q1`.
 */
export function toDescriptive(move: ForwardMove, prior: string) {
  const { found, moves } = forwardMove(prior, move);
  if (found.isKingsideCastle()) return "O-O";
  if (found.isQueensideCastle()) return "O-O-O";

  const piece = found.piece.toUpperCase();
  const rest = descriptiveRest(found);
  const ambiguous = moves.some(
    (other) =>
      other !== found &&
      other.piece === found.piece &&
      descriptiveRest(other) === rest,
  );
  return ambiguous
    ? `${piece}(${descriptiveSquare(found.from, found.color)})${rest}`
    : `${piece}${rest}`;
}

const NOTATORS = { algebraic: toAlgebraic, descriptive: toDescriptive };

export type Notation = keyof typeof NOTATORS;

/** Notation of the forward move that a retro move takes back: `position` is the one shown, `prior` the one before the move. */
export function notateRetro(
  notation: Notation,
  retro: Pick<Move, "from" | "to"> & { unpromote?: boolean },
  position: string,
  prior: string,
) {
  return NOTATORS[notation](toForward(retro, position), prior);
}
