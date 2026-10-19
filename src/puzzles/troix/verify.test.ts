import { describe, expect, it } from "vitest";
import { payload } from "./fixture";
import { verifyTroix } from "./verify";

describe("verifyTroix", () => {
  it("accepts a puzzle with one solution", () => {
    expect(() => verifyTroix(payload)).not.toThrow();
  });

  it("rejects two givens on one cell", () => {
    expect(() =>
      verifyTroix({
        ...payload,
        givens: [...payload.givens, { row: 0, col: 2, symbol: "x" }],
      }),
    ).toThrow(/duplicate given/);
  });

  it("rejects a puzzle with more than one solution", () => {
    expect(() =>
      verifyTroix({
        ...payload,
        givens: payload.givens.slice(2),
      }),
    ).toThrow(/more than one solution/);
  });

  it("rejects a puzzle with no solution", () => {
    expect(() =>
      verifyTroix({
        size: 6,
        givens: [0, 1, 2].map((col) => ({ row: 0, col, symbol: "o" as const })),
      }),
    ).toThrow(/no solution/);
  });
});
