import { describe, expect, it } from "vitest";
import { pieceCode, retroDrop, stepSquare, toPositionData } from "./squares";

describe("chess-board squares", () => {
  it("maps piece rows to react-chessboard position data", () => {
    expect(
      toPositionData([
        { file: "e", rank: 8, colour: "black", piece: "king" },
        { file: "f", rank: 7, colour: "white", piece: "knight" },
      ]),
    ).toEqual({ e8: { pieceType: "bK" }, f7: { pieceType: "wN" } });
    expect(pieceCode("black", "pawn")).toBe("bP");
  });

  it("reports a drag as a forward move from the drop square to the source", () => {
    expect(retroDrop("f7", "g5")).toEqual({ from: "g5", to: "f7" });
  });

  it("steps by screen direction and clamps at the edges", () => {
    expect(stepSquare("e4", "up", "white")).toBe("e5");
    expect(stepSquare("e4", "up", "black")).toBe("e3");
    expect(stepSquare("e4", "right", "black")).toBe("d4");
    expect(stepSquare("h8", "up", "white")).toBe("h8");
    expect(stepSquare("a1", "left", "white")).toBe("a1");
  });
});
