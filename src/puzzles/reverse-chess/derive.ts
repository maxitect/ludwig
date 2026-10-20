import { Chess, DEFAULT_POSITION } from "chess.js";
import type { Move } from "chess.js";
import type { PositionGoal } from "./schema";
import { fromFen } from "../_shared/chess-fen";
import { notate, type ForwardMove, type Notation } from "../_shared/chess-notation";

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

/** Notation of the forward move that a retro move takes back: `position` is the one shown, `prior` the one before the move. */
export function notateRetro(
  notation: Notation,
  retro: Pick<Move, "from" | "to"> & { unpromote?: boolean },
  position: string,
  prior: string,
) {
  return notate(notation, toForward(retro, position), prior);
}
