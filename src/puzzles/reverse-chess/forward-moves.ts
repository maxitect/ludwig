import type { PieceSymbol, Square } from "chess.js";

/**
 * A compact forward move generator for `proof-search.ts`, which visits far more positions than chess.js can generate in time.
 * Squares are `rank * 8 + file` (a1 is 0), pieces are 1 to 6 (pawn, knight, bishop, rook, queen, king) for White and 7 to 12 for Black.
 * It follows chess.js exactly, which `forward-moves.test.ts` checks against it by perft and by replaying random games.
 */

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

const EP_FLAG = 1 << 15;
const CASTLE_FLAG = 2 << 15;

/** Bits of `Position.castling`. */
const WHITE_KINGSIDE = 1;
const WHITE_QUEENSIDE = 2;
const BLACK_KINGSIDE = 4;
const BLACK_QUEENSIDE = 8;

export type Position = {
  board: Int8Array;
  white: boolean;
  castling: number;
  ep: number;
  whiteKing: number;
  blackKing: number;
};

export const typeOf = (piece: number) => ((piece - 1) % 6) + 1;
export const isWhite = (piece: number) => piece <= 6;

const file = (square: number) => square & 7;
const rank = (square: number) => square >> 3;

const offsets = (square: number, steps: readonly (readonly [number, number])[]) =>
  steps.flatMap(([df, dr]) => {
    const f = file(square) + df;
    const r = rank(square) + dr;
    return f >= 0 && f < 8 && r >= 0 && r < 8 ? [r * 8 + f] : [];
  });

const KNIGHT_STEPS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const;
const ROOK_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
const BISHOP_STEPS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;
const KING_STEPS = [...ROOK_STEPS, ...BISHOP_STEPS] as const;

const squares = Array.from({ length: 64 }, (_, square) => square);
const KNIGHT_TARGETS = squares.map((square) => offsets(square, KNIGHT_STEPS));
const KING_TARGETS = squares.map((square) => offsets(square, KING_STEPS));

function rays(steps: readonly (readonly [number, number])[]) {
  return squares.map((square) =>
    steps.map(([df, dr]) => {
      const ray: number[] = [];
      for (let n = 1; n < 8; n += 1) {
        const f = file(square) + df * n;
        const r = rank(square) + dr * n;
        if (f < 0 || f > 7 || r < 0 || r > 7) break;
        ray.push(r * 8 + f);
      }
      return ray;
    }),
  );
}
const ROOK_RAYS = rays(ROOK_STEPS);
const BISHOP_RAYS = rays(BISHOP_STEPS);

const CASTLING_LOST = new Int8Array(64);
CASTLING_LOST[0] = WHITE_QUEENSIDE;
CASTLING_LOST[7] = WHITE_KINGSIDE;
CASTLING_LOST[4] = WHITE_KINGSIDE | WHITE_QUEENSIDE;
CASTLING_LOST[56] = BLACK_QUEENSIDE;
CASTLING_LOST[63] = BLACK_KINGSIDE;
CASTLING_LOST[60] = BLACK_KINGSIDE | BLACK_QUEENSIDE;

export function startingPosition(): Position {
  const board = new Int8Array(64);
  const back = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];
  for (let f = 0; f < 8; f += 1) {
    board[f] = back[f];
    board[8 + f] = PAWN;
    board[48 + f] = PAWN + 6;
    board[56 + f] = back[f] + 6;
  }
  return {
    board,
    white: true,
    castling: 15,
    ep: -1,
    whiteKing: 4,
    blackKing: 60,
  };
}

/** True when a piece of the given colour attacks `square`. */
export function attacked(board: Int8Array, square: number, byWhite: boolean) {
  const offset = byWhite ? 0 : 6;
  const f = file(square);
  const behind = byWhite ? -8 : 8;
  if (f > 0 && board[square + behind - 1] === PAWN + offset) return true;
  if (f < 7 && board[square + behind + 1] === PAWN + offset) return true;
  for (const from of KNIGHT_TARGETS[square]) {
    if (board[from] === KNIGHT + offset) return true;
  }
  for (const from of KING_TARGETS[square]) {
    if (board[from] === KING + offset) return true;
  }
  const slide = (lines: number[][][], straight: number) => {
    for (const ray of lines[square]) {
      for (const from of ray) {
        const piece = board[from];
        if (!piece) continue;
        if (piece === straight + offset || piece === QUEEN + offset) return true;
        break;
      }
    }
    return false;
  };
  return slide(ROOK_RAYS, ROOK) || slide(BISHOP_RAYS, BISHOP);
}

const encode = (from: number, to: number, promotion = 0, flag = 0) =>
  from | (to << 6) | (promotion << 12) | flag;
export const moveFrom = (move: number) => move & 63;
export const moveTo = (move: number) => (move >> 6) & 63;
export const movePromotion = (move: number) => (move >> 12) & 7;

function pseudoMoves(position: Position) {
  const { board, white, castling, ep } = position;
  const moves: number[] = [];
  const enemy = (piece: number) => piece !== 0 && isWhite(piece) !== white;
  const step = white ? 8 : -8;
  const startRank = white ? 1 : 6;
  const lastRank = white ? 7 : 0;

  const addPawn = (from: number, to: number, flag = 0) => {
    if (rank(to) === lastRank) {
      for (const promotion of [QUEEN, ROOK, BISHOP, KNIGHT]) {
        moves.push(encode(from, to, promotion));
      }
    } else {
      moves.push(encode(from, to, 0, flag));
    }
  };

  for (let from = 0; from < 64; from += 1) {
    const piece = board[from];
    if (!piece || isWhite(piece) !== white) continue;
    const type = typeOf(piece);

    if (type === PAWN) {
      const ahead = from + step;
      if (!board[ahead]) {
        addPawn(from, ahead);
        if (rank(from) === startRank && !board[ahead + step]) {
          moves.push(encode(from, ahead + step));
        }
      }
      for (const df of [-1, 1]) {
        const f = file(from) + df;
        if (f < 0 || f > 7) continue;
        const to = ahead + df;
        if (enemy(board[to])) addPawn(from, to);
        else if (to === ep) moves.push(encode(from, to, 0, EP_FLAG));
      }
    } else if (type === KNIGHT || type === KING) {
      const targets = type === KNIGHT ? KNIGHT_TARGETS : KING_TARGETS;
      for (const to of targets[from]) {
        if (!board[to] || enemy(board[to])) moves.push(encode(from, to));
      }
    } else {
      const lines =
        type === ROOK
          ? ROOK_RAYS[from]
          : type === BISHOP
            ? BISHOP_RAYS[from]
            : [...ROOK_RAYS[from], ...BISHOP_RAYS[from]];
      for (const ray of lines) {
        for (const to of ray) {
          if (!board[to]) {
            moves.push(encode(from, to));
            continue;
          }
          if (enemy(board[to])) moves.push(encode(from, to));
          break;
        }
      }
    }
  }

  const home = white ? 0 : 56;
  const kingside = white ? WHITE_KINGSIDE : BLACK_KINGSIDE;
  const queenside = white ? WHITE_QUEENSIDE : BLACK_QUEENSIDE;
  const safe = (...targets: number[]) =>
    targets.every((square) => !attacked(board, home + square, !white));
  if (
    castling & kingside &&
    !board[home + 5] &&
    !board[home + 6] &&
    safe(4, 5, 6)
  ) {
    moves.push(encode(home + 4, home + 6, 0, CASTLE_FLAG));
  }
  if (
    castling & queenside &&
    !board[home + 1] &&
    !board[home + 2] &&
    !board[home + 3] &&
    safe(4, 3, 2)
  ) {
    moves.push(encode(home + 4, home + 2, 0, CASTLE_FLAG));
  }
  return moves;
}

/** The position after `move`, which must come from `legalMoves(position)`. */
export function play(position: Position, move: number): Position {
  const board = position.board.slice();
  const from = moveFrom(move);
  const to = moveTo(move);
  const promotion = movePromotion(move);
  const piece = board[from];
  const white = position.white;
  board[from] = 0;
  if ((move & (3 << 15)) === EP_FLAG) board[to + (white ? -8 : 8)] = 0;
  if ((move & (3 << 15)) === CASTLE_FLAG) {
    const kingside = to > from;
    board[kingside ? from + 3 : from - 4] = 0;
    board[kingside ? from + 1 : from - 1] = white ? ROOK : ROOK + 6;
  }
  board[to] = promotion ? promotion + (white ? 0 : 6) : piece;
  const double = typeOf(piece) === PAWN && Math.abs(to - from) === 16;
  return {
    board,
    white: !white,
    castling: position.castling & ~CASTLING_LOST[from] & ~CASTLING_LOST[to],
    ep: double ? (from + to) >> 1 : -1,
    whiteKing: piece === KING ? to : position.whiteKing,
    blackKing: piece === KING + 6 ? to : position.blackKing,
  };
}

const kingOf = (position: Position, white: boolean) =>
  white ? position.whiteKing : position.blackKing;

/** Every legal move for the side to move. */
export function legalMoves(position: Position) {
  return pseudoMoves(position).filter((move) => {
    const next = play(position, move);
    return !attacked(next.board, kingOf(next, position.white), !position.white);
  });
}

/** The en passant square when a legal capture onto it exists, which is how chess.js prints it, else -1. */
export function effectiveEnPassant(position: Position) {
  if (position.ep < 0) return -1;
  return pseudoMoves(position).some((move) => {
    if ((move & (3 << 15)) !== EP_FLAG) return false;
    const next = play(position, move);
    return !attacked(next.board, kingOf(next, position.white), !position.white);
  })
    ? position.ep
    : -1;
}

const LETTERS = ".pnbrqk";
const SQUARE_NAMES = squares.map(
  (square) => `${"abcdefgh"[file(square)]}${rank(square) + 1}` as Square,
);
export const squareName = (square: number) => SQUARE_NAMES[square];
export const symbolOf = (type: number) => LETTERS[type] as PieceSymbol;

/** Everything that decides which moves a position allows, as a string, for remembering positions already searched. */
export function memoKey(position: Position) {
  return `${String.fromCharCode(...position.board)}${position.white ? "w" : "b"}${position.castling}${effectiveEnPassant(position)}`;
}

/** The first four FEN fields, as chess.js prints them. */
export function positionKey(position: Position) {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r -= 1) {
    let row = "";
    let empty = 0;
    for (let f = 0; f < 8; f += 1) {
      const piece = position.board[r * 8 + f];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      const letter = LETTERS[typeOf(piece)];
      row += isWhite(piece) ? letter.toUpperCase() : letter;
    }
    rows.push(row + (empty || ""));
  }
  const rights =
    [
      position.castling & WHITE_KINGSIDE && "K",
      position.castling & WHITE_QUEENSIDE && "Q",
      position.castling & BLACK_KINGSIDE && "k",
      position.castling & BLACK_QUEENSIDE && "q",
    ]
      .filter(Boolean)
      .join("") || "-";
  const ep = effectiveEnPassant(position);
  return `${rows.join("/")} ${position.white ? "w" : "b"} ${rights} ${ep < 0 ? "-" : SQUARE_NAMES[ep]}`;
}
