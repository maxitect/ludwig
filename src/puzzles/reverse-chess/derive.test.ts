import { describe, expect, it } from "vitest";
import { fromFen, toFen } from "./derive";

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
