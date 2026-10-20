import { describe, expect, it } from "vitest";
import { cluesOf, runsOf } from "./derive";
import { shadedCells } from "./verify";

const line = (text: string) => [...text].map((char) => char === "#");

describe("runsOf", () => {
  it("gives no runs for an empty line", () => {
    expect(runsOf(line("....."))).toEqual([]);
  });

  it("gives one run for a full line", () => {
    expect(runsOf(line("#####"))).toEqual([5]);
  });

  it("lists split runs in order, including one at each end", () => {
    expect(runsOf(line("##.#.###"))).toEqual([2, 1, 3]);
    expect(runsOf(line("#...#"))).toEqual([1, 1]);
  });
});

describe("cluesOf", () => {
  it("derives the row and column clues of a picture", () => {
    const grid = ["##..#", ".....", "#####", ".#.#.", "##.##"];
    expect(cluesOf(5, 5, shadedCells({ grid }))).toEqual({
      rowClues: [[2, 1], [], [5], [1, 1], [2, 2]],
      colClues: [[1, 1, 1], [1, 3], [1], [3], [1, 1, 1]],
    });
  });

  it("reads a picture that is wider than it is tall", () => {
    const grid = ["#.#.#", "#####", "....."];
    expect(cluesOf(3, 5, shadedCells({ grid }))).toEqual({
      rowClues: [[1, 1, 1], [5], []],
      colClues: [[2], [1], [2], [1], [2]],
    });
  });
});
