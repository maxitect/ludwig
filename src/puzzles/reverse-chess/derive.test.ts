import { describe, expect, it } from "vitest";
import {
  fromFen,
  satisfiesGoal,
  toAlgebraic,
  toDescriptive,
  toFen,
} from "./derive";

describe("toFen and fromFen", () => {
  it.each([
    "k7/8/1K6/8/8/8/8/R7 b - - 1 1",
    "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
    "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
  ])("round-trips %s", (fen) => {
    expect(toFen(fromFen(fen))).toBe(fen);
  });

  it("reads piece rows from a FEN", () => {
    expect(fromFen("k7/8/1K6/8/8/8/8/R7 b - - 1 1")).toEqual({
      sideToMove: "black",
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
      enPassantFile: null,
      halfmove: 1,
      fullmove: 1,
      pieces: [
        { file: "a", rank: 8, colour: "black", piece: "king" },
        { file: "b", rank: 6, colour: "white", piece: "king" },
        { file: "a", rank: 1, colour: "white", piece: "rook" },
      ],
    });
  });

  it("emits castling in KQkq order whatever the piece order", () => {
    const position = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(toFen({ ...position, pieces: [...position.pieces].reverse() })).toBe(
      "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    );
    expect(
      toFen({ ...position, whiteKingside: false, blackQueenside: false }),
    ).toContain(" Qk ");
  });

  it("puts the en passant rank on 3 when Black is to move", () => {
    expect(toFen(fromFen("4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1"))).toBe(
      "4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1",
    );
  });
});

describe("forward move notation", () => {
  const cases = [
    { name: "white Ng1-f3", prior: "4k3/8/8/8/8/8/8/4K1N1 w - - 0 1", move: { from: "g1", to: "f3" }, algebraic: "Nf3", descriptive: "N-KB3" },
    { name: "black Nb8-c6", prior: "1n2k3/8/8/8/8/8/8/4K3 b - - 0 1", move: { from: "b8", to: "c6" }, algebraic: "Nc6", descriptive: "N-QB3" },
    { name: "black Ng8-f6", prior: "4k1n1/8/8/8/8/8/8/4K3 b - - 0 1", move: { from: "g8", to: "f6" }, algebraic: "Nf6", descriptive: "N-KB3" },
    { name: "white castling", prior: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", move: { from: "e1", to: "g1" }, algebraic: "O-O", descriptive: "O-O" },
    { name: "black queenside castling", prior: "r3k3/8/8/8/8/8/8/4K3 b q - 0 1", move: { from: "e8", to: "c8" }, algebraic: "O-O-O", descriptive: "O-O-O" },
    { name: "white promotion", prior: "7k/4P3/8/8/8/8/8/K7 w - - 0 1", move: { from: "e7", to: "e8", promotion: "q" }, algebraic: "e8=Q", descriptive: "P-K8=Q" },
    { name: "black Ng8-e7", prior: "4k1n1/8/8/8/8/8/8/4K3 b - - 0 1", move: { from: "g8", to: "e7" }, algebraic: "Ne7", descriptive: "N-K2" },
    { name: "white pawn capture", prior: "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", move: { from: "e4", to: "d5" }, algebraic: "exd5", descriptive: "PxP" },
    { name: "check marks are dropped", prior: "7k/8/8/8/8/8/8/K6R w - - 0 1", move: { from: "h1", to: "h7" }, algebraic: "Rh7", descriptive: "R-KR7" },
  ] as const;

  it.each(cases)("$name", ({ prior, move, algebraic, descriptive }) => {
    expect(toAlgebraic(move, prior)).toBe(algebraic);
    expect(toDescriptive(move, prior)).toBe(descriptive);
  });

  it("adds the origin square only when two pieces would read the same", () => {
    const prior = "4k3/8/8/8/8/8/4K3/R6R w - - 0 1";
    expect(toDescriptive({ from: "h1", to: "d1" }, prior)).toBe("R(KR1)-Q1");
    expect(toDescriptive({ from: "a1", to: "d1" }, prior)).toBe("R(QR1)-Q1");
    expect(toDescriptive({ from: "a1", to: "a2" }, prior)).toBe("R-QR2");
  });

  it("throws for a move that is not legal in the prior position", () => {
    expect(() =>
      toAlgebraic({ from: "a1", to: "a8" }, "4k3/8/8/8/8/8/8/4K3 w - - 0 1"),
    ).toThrow();
  });
});

describe("satisfiesGoal", () => {
  const fen = "r3k3/8/8/8/8/8/PP6/R3K2R w KQq - 0 1";

  it("matches a piece on a square", () => {
    const goal = { kind: "piece_on_square", colour: "white", piece: "pawn", file: "a", rank: 2 } as const;
    expect(satisfiesGoal(fen, goal)).toBe(true);
    expect(satisfiesGoal(fen, { ...goal, colour: "black" })).toBe(false);
    expect(satisfiesGoal(fen, { ...goal, rank: 3 })).toBe(false);
  });

  it("matches a castling right", () => {
    const goal = { kind: "castling_right", colour: "white", side: "kingside" } as const;
    expect(satisfiesGoal(fen, goal)).toBe(true);
    expect(satisfiesGoal(fen, { ...goal, colour: "black" })).toBe(false);
    expect(satisfiesGoal(fen, { ...goal, colour: "black", side: "queenside" })).toBe(true);
  });

  it("matches an exact piece count", () => {
    const goal = { kind: "piece_count", colour: "white", piece: "rook", count: 2 } as const;
    expect(satisfiesGoal(fen, goal)).toBe(true);
    expect(satisfiesGoal(fen, { ...goal, count: 1 })).toBe(false);
  });
});
