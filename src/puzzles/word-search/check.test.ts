import { describe, expect, it } from "vitest";
import { check } from "./check";
import type { Payload, Solution } from "./schema";

const payload: Payload = { rows: 3, cols: 4, cells: [], words: ["CAT", "DOG"] };
const solution: Solution = [
  { word: "CAT", start: { row: 0, col: 0 }, end: { row: 0, col: 2 } },
  { word: "DOG", start: { row: 2, col: 3 }, end: { row: 0, col: 3 } },
];
const cat = { start: { row: 0, col: 0 }, end: { row: 0, col: 2 } };
const dog = { start: { row: 2, col: 3 }, end: { row: 0, col: 3 } };

describe("check", () => {
  it("accepts a selection for every word", () => {
    expect(check(payload, solution, { selections: [cat, dog] })).toEqual({
      correct: true,
    });
  });

  it("accepts a selection made from either end", () => {
    const reversed = { start: cat.end, end: cat.start };
    expect(check(payload, solution, { selections: [reversed, dog] }).correct).toBe(true);
  });

  it("rejects a missing word", () => {
    expect(check(payload, solution, { selections: [cat] }).correct).toBe(false);
    expect(check(payload, solution, { selections: [] }).correct).toBe(false);
  });

  it("rejects a selection that is one cell off", () => {
    const off = { start: cat.start, end: { row: 0, col: 1 } };
    expect(check(payload, solution, { selections: [off, dog] }).correct).toBe(false);
  });

  it("returns nothing beyond correct", () => {
    expect(Object.keys(check(payload, solution, { selections: [] }))).toEqual(["correct"]);
  });
});
