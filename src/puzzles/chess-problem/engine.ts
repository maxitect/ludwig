import { Chess, type Move } from "chess.js";

export type MoveInput = { from: string; to: string; promotion?: string };

const uci = ({ from, to, promotion }: MoveInput) =>
  `${from}${to}${promotion ?? ""}`;

export const sameMove = (a: MoveInput, b: MoveInput) => uci(a) === uci(b);

const delivers = (move: Move) => move.san.endsWith("#");

/** White to move on `chess` can force mate within `n` of his own moves, whatever Black plays. */
function forcesMate(chess: Chess, n: number): boolean {
  const moves = chess.moves({ verbose: true });
  if (moves.some(delivers)) return true;
  return n > 1 && moves.some((move) => leavesNoDefence(chess, move, n));
}

/** After `move`, every Black reply still lets White mate within `n - 1` more moves. */
function leavesNoDefence(chess: Chess, move: Move, n: number) {
  chess.move(move);
  const replies = chess.moves({ verbose: true });
  let forced = replies.length > 0;
  for (const reply of replies) {
    if (!forced) break;
    chess.move(reply);
    forced = forcesMate(chess, n - 1);
    chess.undo();
  }
  chess.undo();
  return forced;
}

/** The White moves in `fen` that force mate within `n` moves: mate at once, or mate against every defence. */
export function keyMoves(fen: string, n: number): Move[] {
  const chess = new Chess(fen);
  return chess
    .moves({ verbose: true })
    .filter((move) => delivers(move) || (n > 1 && leavesNoDefence(chess, move, n)));
}

/**
 * Black's reply in `fen` (Black to move), when White still has `n` moves to mate: the one leaving White the fewest
 * mating continuations, ties broken by UCI order. Null when Black has no move.
 */
export function defence(fen: string, n: number): Move | null {
  const chess = new Chess(fen);
  const replies = chess
    .moves({ verbose: true })
    .toSorted((a, b) => uci(a).localeCompare(uci(b)));
  let best: { reply: Move; continuations: number } | null = null;
  for (const reply of replies) {
    chess.move(reply);
    const continuations = chess
      .moves({ verbose: true })
      .filter((move) => delivers(move) || (n > 1 && leavesNoDefence(chess, move, n)))
      .length;
    chess.undo();
    if (!best || continuations < best.continuations) {
      best = { reply, continuations };
    }
  }
  return best?.reply ?? null;
}

/**
 * Whether `plies` is a legal line from `fen` that starts with a key move and ends in checkmate by White within `2n - 1` plies.
 * `keys` defaults to `keyMoves(fen, n)`; pass it when the caller has already solved the position.
 */
export function checkLine(
  fen: string,
  n: number,
  plies: readonly MoveInput[],
  keys: readonly MoveInput[] = keyMoves(fen, n),
) {
  if (plies.length === 0 || plies.length > 2 * n - 1 || plies.length % 2 === 0) {
    return false;
  }
  if (!keys.some((key) => sameMove(key, plies[0]))) return false;
  const chess = new Chess(fen);
  try {
    for (const { from, to, promotion } of plies) {
      chess.move({ from, to, promotion });
    }
  } catch {
    return false;
  }
  return chess.isCheckmate();
}
