import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  legalMoves,
  memoKey,
  play,
  positionKey,
  startingPosition,
  type Position,
} from "./forward-moves";
import { proofGames } from "./proof-search";

/** Every distinct end position of a game of `plies` moves, with the number of games that reach it. No pruning is involved. */
function exactCounts(plies: number) {
  let layer = new Map([[memoKey(startingPosition()), { position: startingPosition(), games: 1 }]]);
  for (let ply = 0; ply < plies; ply += 1) {
    const next = new Map<string, { position: Position; games: number }>();
    for (const { position, games } of layer.values()) {
      for (const move of legalMoves(position)) {
        const child = play(position, move);
        const key = memoKey(child);
        const seen = next.get(key);
        if (seen) seen.games += games;
        else next.set(key, { position: child, games });
      }
    }
    layer = next;
  }
  const counts = new Map<string, { fen: string; games: number }>();
  for (const { position, games } of layer.values()) {
    const key = positionKey(position);
    const seen = counts.get(key);
    if (seen) seen.games += games;
    else counts.set(key, { fen: `${key} 0 1`, games });
  }
  return counts;
}

/** Every `step`th target, so each run covers positions with one game and with many. */
const sample = (counts: ReturnType<typeof exactCounts>, step: number) =>
  [...counts.values()].filter((_, index) => index % step === 0);

describe("proofGames", () => {
  for (const [plies, step] of [
    [1, 1],
    [2, 7],
    [3, 97],
    [4, 997],
  ] as const) {
    it(`finds as many games as the unpruned count at ${plies} plies`, () => {
      const counts = exactCounts(plies);
      const targets = sample(counts, step);
      expect(targets.length).toBeGreaterThan(0);
      for (const { fen, games } of targets) {
        expect(proofGames(fen, plies, Infinity)).toHaveLength(games);
      }
    }, 120000);
  }

  it("matches the unpruned search with pruning switched off", () => {
    const counts = exactCounts(3);
    for (const { fen, games } of sample(counts, 211)) {
      expect(proofGames(fen, 3, Infinity, { prune: false })).toHaveLength(games);
    }
  });

  it("returns games that replay to the target in chess.js", () => {
    const [{ fen }] = [...exactCounts(4).values()].filter(({ games }) => games > 1);
    const games = proofGames(fen, 4, Infinity);
    expect(games.length).toBeGreaterThan(1);
    for (const game of games) {
      const chess = new Chess();
      for (const move of game) chess.move(move);
      expect(chess.fen().split(" ").slice(0, 4).join(" ")).toBe(
        fen.split(" ").slice(0, 4).join(" "),
      );
    }
  });

  it("counts every move order of both sides as a game", () => {
    const chess = new Chess();
    for (const san of ["Nf3", "Nf6", "Nc3", "Nc6"]) chess.move(san);
    expect(proofGames(chess.fen(), 4, 10)).toHaveLength(4);
  });

  it("finds one game when the order is forced", () => {
    const chess = new Chess();
    for (const san of ["e4", "e5", "Ke2", "Ke7"]) chess.move(san);
    expect(proofGames(chess.fen(), 4, 10)).toHaveLength(1);
  });

  it("finds no game for a position that needs more plies", () => {
    const chess = new Chess();
    for (const san of ["Nf3", "Nf6", "Nc3", "Nc6"]) chess.move(san);
    expect(proofGames(chess.fen(), 2, 10)).toHaveLength(0);
  });

  it("finds no game for a position with the wrong castling rights", () => {
    const chess = new Chess();
    for (const san of ["Nf3", "Nf6", "Ng1", "Ng8"]) chess.move(san);
    const [placement, side, , ep] = chess.fen().split(" ");
    expect(proofGames(`${placement} ${side} KQk ${ep} 0 3`, 4, 10)).toHaveLength(0);
    expect(proofGames(`${placement} ${side} KQkq ${ep} 0 3`, 4, 10)).toHaveLength(
      proofGames(chess.fen(), 4, 10).length,
    );
  });

  it("gives up rather than run past its budget", () => {
    const chess = new Chess();
    for (const san of ["Nf3", "Nf6", "Nc3", "Nc6", "Ng1", "Ng8", "Nb1", "Nb8"]) {
      chess.move(san);
    }
    expect(() => proofGames(chess.fen(), 8, 10, { maxPositions: 50 })).toThrow(
      /gave up/,
    );
  });
});
