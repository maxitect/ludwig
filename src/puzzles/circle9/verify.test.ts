import { describe, expect, it } from "vitest";
import { content as looseEnds } from "../../../content/circle9/loose-ends";
import { decoys, payload } from "./fixture";
import { contentSchema, type Payload } from "./schema";
import { numbers, verifyCircle9 } from "./verify";

const gridOf = (placed: Payload["numbers"]) =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from(
      { length: 9 },
      (_, col) =>
        placed.find((number) => number.row === row && number.col === col)
          ?.digit ?? ".",
    ).join(""),
  );

describe("verifyCircle9", () => {
  it("accepts a unique puzzle", () => {
    expect(() => verifyCircle9(looseEnds)).not.toThrow();
  });

  it("reads a digit as a number and a full stop as an empty cell", () => {
    expect(
      numbers({ grid: ["3........", ".........", "....7....", ...Array(6).fill(".........")] }),
    ).toEqual([
      { row: 0, col: 0, digit: 3 },
      { row: 2, col: 4, digit: 7 },
    ]);
  });

  it("accepts the fixture and rejects it with two decoys that open a second solution", () => {
    expect(() => verifyCircle9({ grid: gridOf(payload.numbers) })).not.toThrow();
    expect(() =>
      verifyCircle9({ grid: gridOf([...payload.numbers, ...decoys]) }),
    ).toThrow(/more than one solution/);
  });

  it("rejects a contradictory puzzle", () => {
    expect(() =>
      verifyCircle9({ grid: Array(9).fill(".........") }),
    ).toThrow(/no solution/);
  });

  it("rejects a grid of the wrong shape or with a zero", () => {
    expect(contentSchema.safeParse({ grid: looseEnds.grid.slice(1) }).success).toBe(false);
    expect(
      contentSchema.safeParse({ grid: [...looseEnds.grid.slice(1), "0........"] }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({ grid: [...looseEnds.grid.slice(1), "12345678"] }).success,
    ).toBe(false);
  });
});
