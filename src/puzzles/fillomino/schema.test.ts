import { describe, expect, it } from "vitest";
import { payload, solution } from "./fixture";
import { contentSchema, payloadSchema } from "./schema";

describe("payloadSchema", () => {
  it("accepts the fixture payload", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it("rejects a payload that carries the solution", () => {
    expect(
      payloadSchema.strict().safeParse({ ...payload, solution }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  it("rejects a 13-wide puzzle, a digit of 0 and a given outside the grid", () => {
    expect(
      contentSchema.safeParse({ rows: 6, cols: 13, givens: [] }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        rows: 6,
        cols: 6,
        givens: [{ row: 0, col: 0, digit: 0 }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        rows: 6,
        cols: 6,
        givens: [{ row: 6, col: 0, digit: 1 }],
      }).success,
    ).toBe(false);
  });
});
