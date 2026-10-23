import { describe, expect, it } from "vitest";
import { clueRun, deriveClues, deriveRuns, runCells } from "./derive";
import { payload, solution } from "./fixture";

/**
 * # # # # #
 * # 1 2 4 #
 * # 3 5 # #
 * # 6 # # #
 */
const shape = [
  { row: 1, col: 1, digit: 1 },
  { row: 1, col: 2, digit: 2 },
  { row: 1, col: 3, digit: 4 },
  { row: 2, col: 1, digit: 3 },
  { row: 2, col: 2, digit: 5 },
  { row: 3, col: 1, digit: 6 },
];

describe("deriveRuns", () => {
  it("finds every maximal stretch, single cells included", () => {
    const runs = deriveRuns(shape);
    expect(runs).toHaveLength(6);
    expect(runs).toEqual(
      expect.arrayContaining([
        { direction: "across", row: 1, col: 1, length: 3 },
        { direction: "across", row: 2, col: 1, length: 2 },
        { direction: "across", row: 3, col: 1, length: 1 },
        { direction: "down", row: 1, col: 1, length: 3 },
        { direction: "down", row: 1, col: 2, length: 2 },
        { direction: "down", row: 1, col: 3, length: 1 },
      ]),
    );
  });

  it("lists the cells of a run", () => {
    expect(runCells({ direction: "down", row: 1, col: 1, length: 3 })).toEqual([
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ]);
  });
});

describe("deriveClues", () => {
  it("puts each sum in the black cell before its run and skips single cells", () => {
    expect(deriveClues(shape)).toEqual([
      { direction: "down", row: 0, col: 1, length: 3, sum: 10 },
      { direction: "down", row: 0, col: 2, length: 2, sum: 7 },
      { direction: "across", row: 1, col: 0, length: 3, sum: 7 },
      { direction: "across", row: 2, col: 0, length: 2, sum: 8 },
    ]);
  });

  it("derives the fixture's clues", () => {
    expect(payload.clues).toEqual([
      { direction: "down", row: 0, col: 1, length: 2, sum: 3 },
      { direction: "down", row: 0, col: 2, length: 2, sum: 4 },
      { direction: "across", row: 1, col: 0, length: 2, sum: 4 },
      { direction: "across", row: 2, col: 0, length: 2, sum: 3 },
    ]);
    expect(deriveClues(solution)).toEqual(payload.clues);
  });

  it("maps a clue back to its run", () => {
    expect(clueRun(payload.clues[2])).toEqual({
      direction: "across",
      row: 1,
      col: 1,
      length: 2,
    });
  });
});
