import { describe, expect, it } from "vitest";
import { COMPASS } from "../_shared/highlight-path/path";
import {
  derivePlacements,
  findPlacements,
  matchSelection,
  samePlacement,
} from "./derive";

const SIZE = 7;

function gridOf(lines: string[]) {
  return {
    rows: lines.length,
    cols: lines[0].length,
    cells: lines.flatMap((line, row) =>
      [...line].map((letter, col) => ({ row, col, letter })),
    ),
  };
}

/** A 7x7 grid of Z with `word` written from `start` along `step`. */
function written(word: string, start: { row: number; col: number }, step: { row: number; col: number }) {
  const lines = Array.from({ length: SIZE }, () => Array(SIZE).fill("Z"));
  [...word].forEach((letter, i) => {
    lines[start.row + step.row * i][start.col + step.col * i] = letter;
  });
  return gridOf(lines.map((line) => line.join("")));
}

describe("findPlacements", () => {
  const compass = [
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
    "north",
    "north-east",
  ];

  it.each(COMPASS.map((step, i) => [compass[i], step] as const))(
    "finds a word written %s, reading from its first letter",
    (_, step) => {
      const start = {
        row: step.row < 0 ? 5 : step.row > 0 ? 1 : 3,
        col: step.col < 0 ? 5 : step.col > 0 ? 1 : 3,
      };
      const end = { row: start.row + step.row * 3, col: start.col + step.col * 3 };
      expect(findPlacements(written("PLAY", start, step), "PLAY")).toEqual([
        { start, end },
      ]);
    },
  );

  it("finds a word that is not in the grid zero times", () => {
    expect(findPlacements(written("PLAY", { row: 0, col: 0 }, COMPASS[0]), "STAR")).toEqual([]);
  });

  it("finds a word hidden twice twice", () => {
    const grid = gridOf(["PLAYZZZ", "ZZZZZZZ", "ZZZZZZZ", "ZZZZZZZ", "ZZZZZZZ", "ZZZZZZZ", "ZZZPLAY"]);
    expect(findPlacements(grid, "PLAY")).toHaveLength(2);
  });

  it("finds a word that is the start of a longer one as a second hit", () => {
    const grid = gridOf(["PLAYERZ", "ZZZZZZZ", "ZPLAYZZ"]);
    expect(findPlacements(grid, "PLAY")).toHaveLength(2);
  });

  it("counts a palindrome once, not once for each way of reading it", () => {
    const grid = gridOf(["ZZZZZZZ", "LEVELZZ", "ZZZZZZZ"]);
    expect(findPlacements(grid, "LEVEL")).toHaveLength(1);
  });

  it("does not run off the edge of the grid", () => {
    expect(findPlacements(gridOf(["PLA"]), "PLAY")).toEqual([]);
  });
});

describe("derivePlacements", () => {
  it("reports each word's placements, in the order of the list", () => {
    const grid = gridOf(["PLAYZ", "ZZZZZ", "ZZZZZ"]);
    const derived = derivePlacements(grid, ["PLAY", "STAR"]);
    expect(derived.map(({ word, placements }) => [word, placements.length])).toEqual([
      ["PLAY", 1],
      ["STAR", 0],
    ]);
  });
});

describe("matchSelection", () => {
  const grid = written("PLAY", { row: 1, col: 1 }, COMPASS[1]);
  const derived = derivePlacements(grid, ["PLAY"]);
  const start = { row: 1, col: 1 };
  const end = { row: 4, col: 4 };

  it("accepts the two ends in either order", () => {
    expect(matchSelection(derived, start, end)).toBe("PLAY");
    expect(matchSelection(derived, end, start)).toBe("PLAY");
  });

  it("rejects a selection that is shorter, longer or elsewhere", () => {
    expect(matchSelection(derived, start, { row: 3, col: 3 })).toBeNull();
    expect(matchSelection(derived, start, { row: 5, col: 5 })).toBeNull();
    expect(matchSelection(derived, { row: 0, col: 0 }, end)).toBeNull();
  });
});

describe("samePlacement", () => {
  it("treats a placement and its reverse as the same line", () => {
    const a = { start: { row: 0, col: 0 }, end: { row: 0, col: 3 } };
    const b = { start: { row: 0, col: 3 }, end: { row: 0, col: 0 } };
    expect(samePlacement(a, b)).toBe(true);
    expect(samePlacement(a, { start: a.start, end: { row: 0, col: 2 } })).toBe(false);
  });
});
