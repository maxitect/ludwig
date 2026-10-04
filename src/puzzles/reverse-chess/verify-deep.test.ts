import { describe, expect, it } from "vitest";
import { fromFen } from "./derive";
import type { Content } from "./schema";
import { verifyReverseChess } from "./verify";

const SIX_PLY_FEN =
  "rkbqnb1r/ppppp1pp/n7/3PPB2/1NPRKp2/B2P1P2/RPPP4/QN6 w - - 0 1";
const SIX_PLY_CHAIN = ["g8h8", "c3c4", "h8g8", "c4d4", "g8h8", "d4d5"];

type Ply = Content["solutionPlies"][number];

const sixPly = (chain: string[], goal: Content["goal"]): Content => {
  const position = fromFen(SIX_PLY_FEN);
  return {
    mode: "unwind",
    sideToMove: position.sideToMove,
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
    halfmove: 0,
    fullmove: 1,
    goal,
    pieces: position.pieces,
    solutionPlies: chain.map((ply) => ({
      fromFile: ply[0] as Ply["fromFile"],
      fromRank: Number(ply[1]),
      toFile: ply[2] as Ply["toFile"],
      toRank: Number(ply[3]),
      unpromote: false,
      special: "none",
    })),
  };
};

const d4Pawn: Content["goal"] = {
  kind: "piece_on_square",
  displayText: "Before the white pawn left d4",
  colour: "white",
  piece: "pawn",
  file: "d",
  rank: 4,
};

describe("verifyReverseChess at six plies", () => {
  it("AC2: verifies a 32-piece Mode B puzzle well inside 5 s", () => {
    const started = performance.now();
    expect(() =>
      verifyReverseChess(sixPly(SIX_PLY_CHAIN, d4Pawn)),
    ).not.toThrow();
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it("AC3: rejects an authored chain that is not the survivor", () => {
    const authored = [...SIX_PLY_CHAIN.slice(0, 5), "e4e5"];
    expect(() => verifyReverseChess(sixPly(authored, d4Pawn))).toThrow(
      /^authored chain does not match unique survivor/,
    );
  });

  it("AC3: rejects a goal that several chains reach", () => {
    const loose: Content["goal"] = {
      kind: "piece_count",
      displayText: "Any chain",
      colour: "black",
      piece: "king",
      count: 1,
    };
    expect(() => verifyReverseChess(sixPly(SIX_PLY_CHAIN, loose))).toThrow(
      "expected exactly 1 chain of 6 retro moves reaching the goal, found at least 2",
    );
  });

  it("AC3: rejects a goal that no chain reaches", () => {
    const unreachable = { ...d4Pawn, rank: 8 } as Content["goal"];
    expect(() =>
      verifyReverseChess(sixPly(SIX_PLY_CHAIN, unreachable)),
    ).toThrow(
      "expected exactly 1 chain of 6 retro moves reaching the goal, found 0",
    );
  });
});
