import { describe, expect, it } from "vitest";
import { applyRetro, replayMatches } from "./engine";

const QUIET = "k7/8/1K6/8/8/8/8/R7 b - - 1 1";

function priorOf(position: string, retro: Parameters<typeof applyRetro>[1]) {
  const result = applyRetro(position, retro);
  if (!result.ok) throw new Error(result.reason);
  return result.prior;
}

describe("applyRetro", () => {
  it("AC1: applies and replays a quiet move", () => {
    const retro = { from: "h1", to: "a1" } as const;
    const prior = priorOf(QUIET, retro);
    expect(prior.split(" ").slice(0, 2)).toEqual(["k7/8/1K6/8/8/8/8/7R", "w"]);
    expect(replayMatches(prior, retro, QUIET)).toBe(true);
  });

  it("AC2: rejects a prior where the side not to move is in check", () => {
    expect(applyRetro(QUIET, { from: "a2", to: "a1" })).toEqual({
      ok: false,
      reason: "non_moving_side_in_check",
    });
  });

  it("AC3: uncaptures a piece", () => {
    const prior = priorOf("4k3/5N2/8/8/8/8/8/4K3 b - - 0 1", {
      from: "g5",
      to: "f7",
      uncapture: "p",
    });
    expect(prior.split(" ").slice(0, 2)).toEqual([
      "4k3/5p2/8/6N1/8/8/8/4K3",
      "w",
    ]);
  });

  it("AC4: unpromotes a piece", () => {
    const prior = priorOf("4Q3/8/8/8/8/8/8/k3K3 b - - 0 1", {
      from: "e7",
      to: "e8",
      unpromote: true,
    });
    expect(prior.split(" ").slice(0, 2)).toEqual(["8/4P3/8/8/8/8/8/k3K3", "w"]);
  });

  it("AC5: un-moves castling", () => {
    const prior = priorOf("4k3/8/8/8/8/8/8/5RK1 b - - 1 1", {
      from: "e1",
      to: "g1",
      special: "castle",
    });
    expect(prior.split(" ").slice(0, 3)).toEqual([
      "4k3/8/8/8/8/8/8/4K2R",
      "w",
      "K",
    ]);
  });

  it("AC6: un-moves en passant", () => {
    const prior = priorOf("4k3/8/3P4/8/8/8/8/4K3 b - - 0 1", {
      from: "e5",
      to: "d6",
      special: "en_passant",
    });
    expect(prior.split(" ").slice(0, 4)).toEqual([
      "4k3/8/8/3pP3/8/8/8/4K3",
      "w",
      "-",
      "d6",
    ]);
  });

  describe("AC7: illegal uncaptures and unpromotions", () => {
    const position = "4k3/5N2/8/8/8/8/8/4K3 b - - 0 1";

    it("rejects uncapturing a king", () => {
      expect(
        applyRetro(position, {
          from: "g5",
          to: "f7",
          uncapture: "k",
        }),
      ).toEqual({ ok: false, reason: "illegal_uncapture" });
    });

    it("rejects uncapturing a pawn onto rank 8", () => {
      expect(
        applyRetro("R3k3/8/8/8/8/8/8/4K3 b - - 0 1", {
          from: "a2",
          to: "a8",
          uncapture: "p",
        }),
      ).toEqual({ ok: false, reason: "illegal_uncapture" });
    });

    it("rejects uncapturing a pawn onto rank 1", () => {
      expect(
        applyRetro("4k3/8/8/8/8/8/8/r3K3 w - - 0 1", {
          from: "a2",
          to: "a1",
          uncapture: "p",
        }),
      ).toEqual({ ok: false, reason: "illegal_uncapture" });
    });

    it("rejects unpromoting away from the back rank", () => {
      expect(
        applyRetro(position, { from: "g6", to: "f7", unpromote: true }),
      ).toEqual({ ok: false, reason: "illegal_unpromote" });
    });
  });

  describe("AC8: structural rejections", () => {
    it("rejects an empty to square", () => {
      expect(applyRetro(QUIET, { from: "h1", to: "d4" })).toEqual({
        ok: false,
        reason: "no_piece_on_to",
      });
    });

    it("rejects moving a piece of the side to move", () => {
      expect(applyRetro(QUIET, { from: "b5", to: "a8" })).toEqual({
        ok: false,
        reason: "wrong_side",
      });
    });

    it("rejects an occupied from square", () => {
      expect(applyRetro(QUIET, { from: "b6", to: "a1" })).toEqual({
        ok: false,
        reason: "origin_occupied",
      });
    });
  });

  it("rejects an invalid FEN", () => {
    expect(applyRetro("not a fen", { from: "h1", to: "a1" })).toEqual({
      ok: false,
      reason: "invalid_fen",
    });
  });

  it("rejects a retro move that does not replay", () => {
    expect(applyRetro(QUIET, { from: "b2", to: "a1" })).toEqual({
      ok: false,
      reason: "replay_mismatch",
    });
  });
});
