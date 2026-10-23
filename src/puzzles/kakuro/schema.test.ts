import { describe, expect, it } from "vitest";
import { payload, solution } from "./fixture";
import { contentSchema, payloadSchema } from "./schema";

describe("payloadSchema", () => {
  it("accepts the fixture payload", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it("rejects a cell that carries its digit", () => {
    expect(
      payloadSchema.strict().safeParse({ ...payload, cells: solution }).success,
    ).toBe(false);
  });

  it("rejects a clue that carries a solution field", () => {
    const clues = payload.clues.map((clue) => ({ ...clue, digits: [1, 2] }));
    expect(
      payloadSchema.strict().safeParse({ ...payload, clues }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  it("rejects a cell outside the grid and a digit of 0", () => {
    expect(
      contentSchema.safeParse({
        rows: 5,
        cols: 5,
        cells: [...solution, { row: 5, col: 1, digit: 1 }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        rows: 5,
        cols: 5,
        cells: [...solution.slice(1), { row: 1, col: 1, digit: 0 }],
      }).success,
    ).toBe(false);
  });
});
