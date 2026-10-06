import { Chess } from "chess.js";
import type { ForwardMove } from "./derive";
import {
  BISHOP,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  legalMoves,
  memoKey,
  moveFrom,
  movePromotion,
  moveTo,
  play,
  positionKey,
  squareName,
  startingPosition,
  symbolOf,
  typeOf,
  type Position,
} from "./forward-moves";

const NEVER = 99;
const LETTER_TYPES = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };
const PROMOTIONS = [KNIGHT, BISHOP, ROOK, QUEEN];

const file = (square: number) => square & 7;
const rank = (square: number) => square >> 3;
const kingSteps = (from: number, to: number) =>
  Math.max(Math.abs(file(from) - file(to)), Math.abs(rank(from) - rank(to)));

/** Fewest moves a pawn needs to reach `to`, ignoring blockers: each file change is a capture, and only a pawn on its start rank may advance two. */
function pawnMoves(white: boolean, from: number, to: number) {
  const forward = white ? rank(to) - rank(from) : rank(from) - rank(to);
  const files = Math.abs(file(from) - file(to));
  if (forward < 0 || files > forward) return NEVER;
  return rank(from) === (white ? 1 : 6) && forward >= 2 && files <= forward - 1
    ? forward - 1
    : forward;
}

/** Never more than the moves a non-pawn needs, ignoring blockers. */
function pieceMoves(type: number, from: number, to: number) {
  const files = Math.abs(file(from) - file(to));
  const ranks = Math.abs(rank(from) - rank(to));
  if (!files && !ranks) return 0;
  if (type === KNIGHT) {
    return Math.max(
      Math.ceil(Math.max(files, ranks) / 2),
      Math.ceil((files + ranks) / 3),
    );
  }
  if (type === BISHOP) return (files + ranks) % 2 ? NEVER : files === ranks ? 1 : 2;
  if (type === ROOK) return !files || !ranks ? 1 : 2;
  if (type === QUEEN) return !files || !ranks || files === ranks ? 1 : 2;
  return Math.max(files, ranks);
}

type Target = {
  count: [number, number];
  /** `moves[colour][type * 64 + square]`: fewest moves for such a piece to end on a target square it could fill. */
  moves: [Uint8Array, Uint8Array];
  /** `castled[colour]`: fewest moves for a king on its home square, castling first, to reach the target king. */
  castled: [number, number];
};

function targetOf(fen: string): Target {
  const sides: [number, number][][] = [[], []];
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (!cell) continue;
      const square = (Number(cell.square[1]) - 1) * 8 + cell.square.charCodeAt(0) - 97;
      sides[cell.color === "w" ? 0 : 1].push([LETTER_TYPES[cell.type], square]);
    }
  }
  const moves = [new Uint8Array(7 * 64), new Uint8Array(7 * 64)] as Target["moves"];
  const castled: [number, number] = [NEVER, NEVER];
  for (const colour of [0, 1]) {
    const white = colour === 0;
    const wanted = sides[colour];
    const of = (type: number) =>
      wanted.filter(([kind]) => kind === type).map(([, square]) => square);
    const last = white ? 7 : 0;
    for (let from = 0; from < 64; from += 1) {
      for (const type of [KNIGHT, BISHOP, ROOK, QUEEN, KING]) {
        moves[colour][type * 64 + from] = Math.min(
          NEVER,
          ...of(type).map((to) => pieceMoves(type, from, to)),
        );
      }
      let pawn = Math.min(NEVER, ...of(PAWN).map((to) => pawnMoves(white, from, to)));
      for (let f = 0; f < 8; f += 1) {
        const reach = pawnMoves(white, from, last * 8 + f);
        for (const promoted of PROMOTIONS) {
          for (const to of of(promoted)) {
            pawn = Math.min(pawn, reach + pieceMoves(promoted, last * 8 + f, to));
          }
        }
      }
      moves[colour][PAWN * 64 + from] = Math.min(NEVER, pawn);
    }
    const home = white ? 0 : 56;
    castled[colour] = Math.min(
      NEVER,
      ...of(KING).flatMap((to) => [home + 2, home + 6].map((landing) => 1 + kingSteps(landing, to))),
    );
  }
  return { count: [sides[0].length, sides[1].length], moves, castled };
}

const costs: [Uint8Array, Uint8Array] = [new Uint8Array(16), new Uint8Array(16)];

/**
 * True unless `target` is provably out of reach in `left` more plies, never wrongly false.
 * Pieces cannot be created, so surplus material is captured by the opponent, one capture per opponent move.
 * Each surviving piece must reach a target square of its own kind (or of a piece it promotes to) in moves of its own,
 * and the dearest surplus pieces are the ones assumed captured. One castling move relocates two pieces.
 */
function viable(position: Position, target: Target, left: number) {
  const count = [0, 0];
  const castles = [position.castling & 3 ? 1 : 0, position.castling & 12 ? 1 : 0];
  for (let square = 0; square < 64; square += 1) {
    const piece = position.board[square];
    if (!piece) continue;
    const colour = piece > 6 ? 1 : 0;
    const type = typeOf(piece);
    let cost = target.moves[colour][type * 64 + square];
    if (castles[colour] && type === KING && square === (colour ? 60 : 4)) {
      cost = Math.min(cost, target.castled[colour]);
    }
    costs[colour][count[colour]] = cost;
    count[colour] += 1;
  }
  for (const colour of [0, 1]) {
    const lost = count[colour] - target.count[colour];
    const captures = count[1 - colour] - target.count[1 - colour];
    if (lost < 0 || captures < 0) return false;

    const own = costs[colour];
    for (let i = 1; i < count[colour]; i += 1) {
      const value = own[i];
      let j = i - 1;
      while (j >= 0 && own[j] > value) {
        own[j + 1] = own[j];
        j -= 1;
      }
      own[j + 1] = value;
    }
    let total = 0;
    for (let i = 0; i < count[colour] - lost; i += 1) total += own[i];

    const budget = (position.white ? colour === 0 : colour === 1)
      ? Math.ceil(left / 2)
      : Math.floor(left / 2);
    if (Math.max(captures, total - castles[colour]) > budget) return false;
  }
  return true;
}

const forwardMove = (move: number): ForwardMove => ({
  from: squareName(moveFrom(move)),
  to: squareName(moveTo(move)),
  promotion: movePromotion(move) ? symbolOf(movePromotion(move)) : undefined,
});

/**
 * Every game of exactly `plies` legal moves from the standard starting position that ends at `target`
 * (placement, side to move, castling rights, en passant square), stopping after `limit` games.
 * Games that differ in move order are different games. A branch is dropped only when `viable` proves
 * the target out of reach in the plies left, or when the same position was already searched to the same depth and held no game.
 * `prune` is switched off by the equivalence tests, which compare against the unpruned search.
 */
export function proofGames(
  fen: string,
  plies: number,
  limit: number,
  prune = true,
) {
  const goal = fen.split(" ").slice(0, 4).join(" ");
  const target = targetOf(fen);
  const found: ForwardMove[][] = [];
  const barren = new Set<string>();
  const game: number[] = [];

  const walk = (position: Position, left: number) => {
    if (left === 0) {
      if (positionKey(position) !== goal) return false;
      found.push(game.map(forwardMove));
      return true;
    }
    const key = `${memoKey(position)}|${left}`;
    if (barren.has(key)) return false;
    let reached = false;
    for (const move of legalMoves(position)) {
      if (found.length >= limit) return true;
      const next = play(position, move);
      if (prune && !viable(next, target, left - 1)) continue;
      game.push(move);
      if (walk(next, left - 1)) reached = true;
      game.pop();
    }
    if (!reached) barren.add(key);
    return reached;
  };

  const start = startingPosition();
  if (!prune || viable(start, target, plies)) walk(start, plies);
  return found;
}
