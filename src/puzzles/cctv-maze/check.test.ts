import { describe, expect, it } from "vitest";
import { check } from "./check";
import type { Payload, Solution } from "./schema";

const payload: Payload = {
  puzzleId: "00000000-0000-4000-8000-000000000000",
  rows: 3,
  cols: 3,
  startRow: 0,
  startCol: 0,
  exitRow: 0,
  exitCol: 2,
  walls: [{ row: 2, col: 1, side: "west" }],
  cameras: [],
};
const solution: Solution = { seen: [{ row: 0, col: 1 }] };
const at = (...cells: [number, number][]) => ({
  path: cells.map(([row, col]) => ({ row, col })),
});

describe("check", () => {
  it("accepts the shortest unseen path", () => {
    expect(
      check(payload, solution, at([0, 0], [1, 0], [1, 1], [1, 2], [0, 2])),
    ).toEqual({ correct: true, firstInvalidStep: null });
  });

  it("accepts a longer unseen path too", () => {
    expect(
      check(
        payload,
        solution,
        at([0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [1, 2], [0, 2]),
      ),
    ).toEqual({ correct: true, firstInvalidStep: null });
  });

  it("names the first step into a seen cell", () => {
    expect(check(payload, solution, at([0, 0], [0, 1], [0, 2]))).toEqual({
      correct: false,
      firstInvalidStep: 1,
    });
  });

  it("names the first step through a wall", () => {
    expect(
      check(payload, solution, at([0, 0], [1, 0], [2, 0], [2, 1])),
    ).toEqual({ correct: false, firstInvalidStep: 3 });
  });

  it("names the first step that is not to a neighbour", () => {
    expect(
      check(payload, solution, at([0, 0], [1, 1], [1, 2], [0, 2])),
    ).toEqual({ correct: false, firstInvalidStep: 1 });
    expect(
      check(payload, solution, at([0, 0], [1, 0], [1, 2])).firstInvalidStep,
    ).toBe(2);
  });

  it("names a path that does not begin at the start", () => {
    expect(
      check(payload, solution, at([1, 0], [1, 1], [1, 2], [0, 2])),
    ).toEqual({ correct: false, firstInvalidStep: 0 });
  });

  it("reports the first of several faults", () => {
    expect(
      check(payload, solution, at([0, 0], [0, 1], [2, 2])).firstInvalidStep,
    ).toBe(1);
  });

  it("rejects a valid path that stops short of the exit", () => {
    expect(check(payload, solution, at([0, 0], [1, 0], [1, 1]))).toEqual({
      correct: false,
      firstInvalidStep: null,
    });
  });
});
