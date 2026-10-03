import { describe, expect, it } from "vitest";
import { content as pawnPush } from "../../../content/reverse-chess/dev-pawn-push";
import { content as unwind } from "../../../content/reverse-chess/dev-unwind";
import { content as rookCheck } from "./fixtures/content/reverse-chess/dev-rook-check";
import path from "node:path";
import { verifyPuzzles } from "../../../scripts/verify-puzzles";
import { registry } from "../registry";
import { enumerateRetro, retroKey } from "./engine";
import { verifyReverseChess } from "./verify";

const ROOK_FEN = "k7/8/1K6/8/8/8/8/R7 b - - 1 1";

describe("enumerateRetro", () => {
  const candidates = enumerateRetro(ROOK_FEN);

  it("AC1: counts 47 candidates for the rook-check fixture", () => {
    expect(candidates).toHaveLength(47);
    const quiet = candidates.filter((retro) => !retro.uncapture);
    expect(quiet.map((retro) => `${retro.from}${retro.to}`).sort()).toEqual(
      [
        "b1a1",
        "c1a1",
        "d1a1",
        "e1a1",
        "f1a1",
        "g1a1",
        "h1a1",
        "a5b6",
        "a6b6",
      ].sort(),
    );
    const rookUncaptures = candidates.filter(
      (retro) => retro.uncapture && retro.to === "a1",
    );
    const kingUncaptures = candidates.filter(
      (retro) => retro.uncapture && retro.to === "b6",
    );
    expect(rookUncaptures).toHaveLength(28);
    expect(rookUncaptures.some((retro) => retro.uncapture === "p")).toBe(false);
    expect(kingUncaptures).toHaveLength(10);
  });

  it("AC2: excluded origins stay excluded", () => {
    const rookOrigins = candidates
      .filter((retro) => retro.to === "a1")
      .map((retro) => retro.from);
    const kingOrigins = candidates
      .filter((retro) => retro.to === "b6")
      .map((retro) => retro.from);
    for (const square of ["a2", "a3", "a4", "a5", "a6", "a7"]) {
      expect(rookOrigins).not.toContain(square);
    }
    for (const square of ["b5", "b7", "c5", "c6", "c7", "a7"]) {
      expect(kingOrigins).not.toContain(square);
    }
  });

  it("AC7: excludes a 9th white pawn", () => {
    const fen = "4k3/8/8/3n4/8/8/PPPPPPPP/4K3 w - - 0 2";
    const uncapturedPawn = enumerateRetro(fen).filter(
      (retro) => retro.uncapture === "p",
    );
    expect(uncapturedPawn).toEqual([]);
    expect(
      enumerateRetro(fen).filter((retro) => retro.uncapture === "q").length,
    ).toBeGreaterThan(0);
  });

  it("AC7: excludes a pawn on the back rank", () => {
    const fen = "7k/p7/8/8/8/8/4K3/8 w - - 0 1";
    const origins = enumerateRetro(fen).map((retro) => retro.from);
    expect(origins).not.toContain("a8");
  });

  it("AC9: enumerates a full-board position in under 200 ms", () => {
    const start = performance.now();
    enumerateRetro("r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1");
    expect(performance.now() - start).toBeLessThan(200);
  });
});

describe("verifyReverseChess", () => {
  it("AC3: rejects the non-unique rook-check fixture with the survivor count", () => {
    expect(() => verifyReverseChess(rookCheck)).toThrow(
      "expected exactly 1 surviving retro move, found 47",
    );
  });

  it("AC3: names the slug and the survivor count when verifying content", async () => {
    const { failures } = await verifyPuzzles(
      registry,
      path.resolve(__dirname, "fixtures/content"),
    );
    expect(failures).toHaveLength(1);
    expect(failures[0].slug).toBe("dev-rook-check");
    expect(failures[0].error).toContain("found 47");
  });

  it("AC4: accepts a unique Mode A puzzle", () => {
    expect(() => verifyReverseChess(pawnPush)).not.toThrow();
  });

  it("AC5: rejects a wrong authored ply", () => {
    const wrong = {
      ...pawnPush,
      solutionPlies: [{ ...pawnPush.solutionPlies[0], fromRank: 4 }],
    };
    expect(() => verifyReverseChess(wrong)).toThrow(
      "authored ply does not match unique survivor",
    );
  });
});

describe("verifyReverseChess Mode B", () => {
  it("AC6: passes a 2-ply chain", () => {
    expect(() => verifyReverseChess(unwind)).not.toThrow();
  });

  it("AC6: fails when the authored plies are swapped", () => {
    const swapped = {
      ...unwind,
      solutionPlies: [...unwind.solutionPlies].reverse(),
    };
    expect(() => verifyReverseChess(swapped)).toThrow(
      /^authored chain does not match unique survivor/,
    );
  });

  it("fails when no chain reaches the goal", () => {
    const unreachable = {
      ...unwind,
      goal: { ...unwind.goal, rank: 5 },
    } as typeof unwind;
    expect(() => verifyReverseChess(unreachable)).toThrow(
      "expected exactly 1 chain of 2 retro moves reaching the goal, found 0",
    );
  });

  it("fails when several chains reach the goal", () => {
    const loose = {
      ...rookCheck,
      mode: "unwind",
      goal: {
        kind: "piece_count",
        displayText: "Any chain",
        colour: "black",
        piece: "king",
        count: 1,
      },
    } as typeof unwind;
    expect(() => verifyReverseChess(loose)).toThrow(/found at least 2/);
  });
});

describe("retroKey", () => {
  it("distinguishes uncaptures", () => {
    expect(retroKey({ from: "a1", to: "a2" })).not.toBe(
      retroKey({ from: "a1", to: "a2", uncapture: "q" }),
    );
  });
});
