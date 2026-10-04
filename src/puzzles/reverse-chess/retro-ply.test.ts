import { describe, expect, it } from "vitest";
import { applyRetro, toRetro } from "./engine";
import { toDraft, toPly, type Draft } from "./retro-ply";

const draft = (overrides: Partial<Draft>): Draft => ({
  from: "e1",
  to: "g1",
  uncapture: "none",
  unpromote: false,
  enPassant: false,
  ...overrides,
});

describe("toPly", () => {
  it("reads a king landing two files from home as castling", () => {
    expect(toPly(draft({}), true)).toMatchObject({
      special: "castle",
      uncapture: null,
      unpromote: false,
    });
    expect(toPly(draft({ to: "c1" }), true).special).toBe("castle");
  });

  it("does not read a rook landing two files from e1 as castling", () => {
    expect(toPly(draft({}), false).special).toBe("none");
  });

  it("does not read a one-file king move as castling", () => {
    expect(toPly(draft({ to: "f1" }), true).special).toBe("none");
  });

  it("marks en passant and drops any uncapture", () => {
    expect(
      toPly(
        draft({ from: "d5", to: "e6", enPassant: true, uncapture: "pawn" }),
        false,
      ),
    ).toMatchObject({ special: "en_passant", uncapture: null });
  });

  it("round-trips through toDraft", () => {
    const ply = toPly(draft({ from: "a7", to: "b8", uncapture: "rook" }), false);
    expect(toDraft(ply)).toMatchObject({ uncapture: "rook", enPassant: false });
  });

  it("builds plies the engine accepts for castling and en passant", () => {
    const castled = "4k3/8/8/8/8/8/8/R4RK1 b - - 1 1";
    expect(applyRetro(castled, toRetro(toPly(draft({}), true))).ok).toBe(true);

    const enPassant = "4k3/8/4P3/8/8/8/8/4K3 b - - 0 1";
    const ply = toPly(
      draft({ from: "d5", to: "e6", enPassant: true }),
      false,
    );
    const result = applyRetro(enPassant, toRetro(ply));
    expect(result.ok && result.prior).toBe("4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1");
  });
});
