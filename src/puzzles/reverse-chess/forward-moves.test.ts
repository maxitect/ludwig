import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  KING,
  legalMoves,
  moveFrom,
  movePromotion,
  moveTo,
  play,
  positionKey,
  squareName,
  startingPosition,
  type Position,
} from "./forward-moves";

const PROMOTION_LETTER = ["", "", "n", "b", "r", "q"];
const TYPES = ".pnbrqk";

/** Builds a generator position from a FEN through chess.js, so the perft tables below can start anywhere. */
function fromFen(fen: string): Position {
  const [, side, rights, ep] = fen.split(" ");
  const board = new Int8Array(64);
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (!cell) continue;
      const square = (Number(cell.square[1]) - 1) * 8 + cell.square.charCodeAt(0) - 97;
      board[square] = TYPES.indexOf(cell.type) + (cell.color === "w" ? 0 : 6);
    }
  }
  const bit = (letter: string, value: number) => (rights.includes(letter) ? value : 0);
  return {
    board,
    white: side === "w",
    castling: bit("K", 1) | bit("Q", 2) | bit("k", 4) | bit("q", 8),
    ep: ep === "-" ? -1 : (Number(ep[1]) - 1) * 8 + ep.charCodeAt(0) - 97,
    whiteKing: board.indexOf(KING),
    blackKing: board.indexOf(KING + 6),
  };
}

const name = (move: number) =>
  `${squareName(moveFrom(move))}${squareName(moveTo(move))}${PROMOTION_LETTER[movePromotion(move)]}`;

function perft(position: Position, depth: number): number {
  const moves = legalMoves(position);
  if (depth === 1) return moves.length;
  return moves.reduce((sum, move) => sum + perft(play(position, move), depth - 1), 0);
}

/** Small deterministic generator, so a failure names the same game on every run. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("legalMoves", () => {
  it("counts the known perft totals from the starting position", () => {
    const start = startingPosition();
    expect([1, 2, 3, 4].map((depth) => perft(start, depth))).toEqual([
      20, 400, 8902, 197281,
    ]);
  });

  it.each([
    ["kiwipete", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039, 97862]],
    ["en passant and pins", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812, 43238]],
    ["promotions and castling", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264, 9467]],
  ] as const)("counts the known perft totals for %s", (_name, fen, totals) => {
    const position = fromFen(fen);
    expect(totals.map((_, depth) => perft(position, depth + 1))).toEqual(totals);
  });

  it("agrees with chess.js on moves and position key through 60 random games", () => {
    const random = mulberry32(81);
    let promotions = 0;
    let enPassants = 0;
    let castles = 0;
    for (let game = 0; game < 60; game += 1) {
      const chess = new Chess();
      let position = startingPosition();
      for (let ply = 0; ply < 120 && !chess.isGameOver(); ply += 1) {
        const verbose = chess.moves({ verbose: true });
        const expected = verbose
          .map((move) => `${move.from}${move.to}${move.promotion ?? ""}`)
          .sort();
        const actual = legalMoves(position).map(name).sort();
        expect(actual).toEqual(expected);
        expect(positionKey(position)).toBe(
          chess.fen().split(" ").slice(0, 4).join(" "),
        );

        const forcing = verbose.filter(
          (move) => move.piece === "p" || move.captured || move.flags.includes("k") || move.flags.includes("q"),
        );
        const pool = random() < 0.7 && forcing.length ? forcing : verbose;
        const picked = pool[Math.floor(random() * pool.length)];
        promotions += picked.promotion ? 1 : 0;
        enPassants += picked.isEnPassant() ? 1 : 0;
        castles += picked.isKingsideCastle() || picked.isQueensideCastle() ? 1 : 0;
        const move = legalMoves(position).find(
          (candidate) =>
            name(candidate) ===
            `${picked.from}${picked.to}${picked.promotion ?? ""}`,
        );
        if (move === undefined) throw new Error(`missing ${picked.san}`);
        position = play(position, move);
        chess.move(picked);
      }
    }
    expect(promotions).toBeGreaterThan(0);
    expect(enPassants).toBeGreaterThan(0);
    expect(castles).toBeGreaterThan(0);
  }, 60000);
});
