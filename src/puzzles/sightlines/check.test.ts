import { describe, expect, it } from "vitest";
import { check } from "./check";
import { answerSchema, type Payload } from "./schema";

const payload: Payload = {
  rows: 1,
  cols: 5,
  targetRow: 0,
  targetCol: 4,
  obstacles: [{ row: 0, col: 2 }],
  observers: [{ row: 0, col: 0, facing: "e", fovDeg: 90 }],
};
const solution = [
  { row: 0, col: 3 },
  { row: 0, col: 4 },
];

describe("check", () => {
  it("accepts exactly the blind spots, in any order", () => {
    expect(
      check(payload, solution, {
        marks: [
          { row: 0, col: 4 },
          { row: 0, col: 3 },
        ],
      }),
    ).toEqual({ correct: true, cellsWrong: 0 });
  });

  it("counts a missing cell", () => {
    expect(check(payload, solution, { marks: [{ row: 0, col: 4 }] })).toEqual({
      correct: false,
      cellsWrong: 1,
    });
  });

  it("counts an extra cell", () => {
    expect(
      check(payload, solution, {
        marks: [...solution, { row: 0, col: 1 }],
      }),
    ).toEqual({ correct: false, cellsWrong: 1 });
  });

  it("counts missing and extra cells together", () => {
    expect(
      check(payload, solution, {
        marks: [
          { row: 0, col: 3 },
          { row: 0, col: 1 },
        ],
      }),
    ).toEqual({ correct: false, cellsWrong: 2 });
  });

  it("rejects an empty answer", () => {
    expect(check(payload, solution, { marks: [] })).toEqual({
      correct: false,
      cellsWrong: 2,
    });
  });
});

describe("answerSchema", () => {
  it("rejects a cell marked twice", () => {
    const mark = { row: 0, col: 3 };
    expect(answerSchema.safeParse({ marks: [mark, mark] }).success).toBe(false);
    expect(answerSchema.safeParse({ marks: [mark] }).success).toBe(true);
  });
});
