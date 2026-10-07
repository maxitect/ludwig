import { describe, expect, it } from "vitest";
import { payload, solution } from "./fixture";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("futoshiki schemas", () => {
  it("parses a payload of size, givens and signs and rejects a solution field", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(
      payloadSchema.strict().safeParse({ ...payload, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema
        .strict()
        .safeParse({
          ...payload,
          inequalities: [{ ...payload.inequalities[0], solved: true }],
        }).success,
    ).toBe(false);
  });

  it("rejects a given, sign or size outside the stored ranges", () => {
    for (const bad of [
      { ...payload, size: 3 },
      { ...payload, size: 8 },
      { ...payload, givens: [{ row: 7, col: 0, digit: 1 }] },
      { ...payload, givens: [{ row: 0, col: 0, digit: 0 }] },
      { ...payload, inequalities: [{ row: 0, col: 0, direction: "right", relation: "eq" }] },
      { ...payload, inequalities: [{ row: 0, col: 0, direction: "left", relation: "lt" }] },
    ]) {
      expect(contentSchema.safeParse(bad).success).toBe(false);
    }
    expect(contentSchema.safeParse(payload).success).toBe(true);
  });

  it("checks digits and coordinates against the puzzle's own size", () => {
    expect(
      contentSchema.safeParse({
        ...payload,
        givens: [{ row: 0, col: 0, digit: 5 }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...payload,
        givens: [{ row: 4, col: 0, digit: 1 }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...payload,
        inequalities: [{ row: 0, col: 3, direction: "right", relation: "lt" }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...payload,
        inequalities: [{ row: 3, col: 0, direction: "down", relation: "lt" }],
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        size: 5,
        givens: [{ row: 4, col: 4, digit: 5 }],
        inequalities: [{ row: 3, col: 4, direction: "down", relation: "gt" }],
      }).success,
    ).toBe(true);
  });

  it("requires an answer of a whole small grid", () => {
    expect(answerSchema.safeParse({ cells: solution }).success).toBe(true);
    expect(answerSchema.safeParse({ cells: solution.slice(1) }).success).toBe(
      false,
    );
  });

  it("parses an attempt of digits and notes", () => {
    const state = {
      cells: [{ row: 0, col: 2, digit: 4 }],
      notes: [{ row: 0, col: 3, digit: 3 }],
    };
    expect(attemptSchema.parse(state)).toEqual(state);
  });
});
