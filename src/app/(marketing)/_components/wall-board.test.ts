import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { WALL_START, WALL_UN_MOVES } from "./wall-board";

const code = (colour: string, piece: string) =>
  `${colour === "white" ? "w" : "b"}${piece === "knight" ? "n" : piece[0]}`;

function replay() {
  const chess = new Chess();
  const moves = ["e4", "d5", "exd5", "Qxd5"].map((san) => chess.move(san));
  return { chess, moves };
}

describe("landing wall board", () => {
  it("draws ranks 8 to 3 of the replayed game", () => {
    const { chess } = replay();
    const played = chess
      .board()
      .flat()
      .filter((cell) => cell !== null && Number(cell.square[1]) >= 3)
      .map((cell) => `${cell!.square}:${cell!.color}${cell!.type}`)
      .sort();
    const drawn = WALL_START.map(
      ({ colour, piece, square }) => `${square}:${code(colour, piece)}`,
    ).sort();
    expect(drawn).toEqual(played);
  });

  it("makes each un-move the reverse of the matching game move", () => {
    const { moves } = replay();
    const reversed = [moves[3], moves[2], moves[1]];
    const queenStart = WALL_START.find(({ piece }) => piece === "queen")!;
    expect(WALL_UN_MOVES.map(({ square }) => square)).toEqual(
      reversed.map((move) => move.to),
    );
    expect(queenStart.square).toBe(reversed[0].to);
    expect(WALL_UN_MOVES.map(({ to }) => to)).toEqual(
      reversed.map((move) => move.from),
    );
    WALL_UN_MOVES.forEach((unMove, index) => {
      expect(code(unMove.colour, unMove.piece)).toBe(
        `${reversed[index].color}${reversed[index].piece}`,
      );
    });
  });
});
