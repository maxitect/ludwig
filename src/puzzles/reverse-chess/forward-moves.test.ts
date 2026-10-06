import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
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
