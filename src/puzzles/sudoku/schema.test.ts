import { describe, expect, it } from "vitest";
import { givens, solution } from "./fixture";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("sudoku schemas", () => {
  it("parses a payload of givens and rejects a solution field", () => {
    expect(payloadSchema.parse({ givens })).toEqual({ givens });
    expect(
      payloadSchema.safeParse({ givens, solution }).success,
    ).toBe(true);
    expect(
      payloadSchema.strict().safeParse({ givens, solution }).success,
    ).toBe(false);
  });

  it("rejects a given outside the grid or the digit range", () => {
    for (const bad of [
      { row: 9, col: 0, digit: 1 },
      { row: 0, col: -1, digit: 1 },
      { row: 0, col: 0, digit: 0 },
      { row: 0, col: 0, digit: 10 },
    ]) {
      expect(contentSchema.safeParse({ givens: [bad] }).success).toBe(false);
    }
  });

  it("requires a complete answer", () => {
    expect(answerSchema.safeParse({ cells: solution }).success).toBe(true);
    expect(
      answerSchema.safeParse({ cells: solution.slice(1) }).success,
    ).toBe(false);
  });

  it("parses an attempt of digits and notes", () => {
    const state = {
      cells: [{ row: 0, col: 2, digit: 4 }],
      notes: [{ row: 0, col: 3, digit: 6 }],
    };
    expect(attemptSchema.parse(state)).toEqual(state);
  });
});
