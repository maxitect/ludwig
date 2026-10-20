import { Chess, type Move } from "chess.js";

export type ForwardMove = Pick<Move, "from" | "to" | "promotion">;

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

/** The forward move played from `prior`, in `notation`, without check or mate marks. */
export const notate = (notation: Notation, move: ForwardMove, prior: string) =>
  NOTATORS[notation](move, prior);
