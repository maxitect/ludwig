import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { regenerate } from "../generators";
import { classicUnits, gridFromGivens, variantFor } from "./engine";
import {
  sudokuKillerGenerators,
  sudokuXvGenerators,
} from "./generate-variants";
import { gradeSudoku } from "./grade";
import { verifySudoku } from "./verify";

const variants = [
  { name: "sudoku-killer", versions: sudokuKillerGenerators },
  { name: "sudoku-xv", versions: sudokuXvGenerators },
] as const;

describe.each(variants)("$name generator", ({ name, versions }) => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = versions[1]("same", 3);
    expect(versions[1]("same", 3)).toEqual(first);
    expect(versions[1]("other", 3).content).not.toEqual(first.content);
    expect(regenerate({ generator: name, version: 1, seed: "same" }, 3)).toEqual(
      first,
    );
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(versions, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: name, version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });
});

describe("sudoku-killer layouts", () => {
  it("cover every cell with cages whose sums match the solved grid", () => {
    for (const difficulty of difficulties) {
      const { content } = sudokuKillerGenerators[1](`layout-${difficulty}`, difficulty);
      const cells = content.cages!.flatMap(({ cells }) => cells);
      expect(new Set(cells.map(({ row, col }) => row * 9 + col)).size).toBe(81);
      expect(cells).toHaveLength(81);
      expect(content.xv).toBeUndefined();
    }
  }, 60_000);

  it("can leave a puzzle with no givens", () => {
    const counts = [...Array(30).keys()].map(
      (index) => sudokuKillerGenerators[1](`bare-${index}`, 2).content.givens.length,
    );
    expect(Math.min(...counts)).toBe(0);
  }, 60_000);
});

describe("sudoku-xv layouts", () => {
  it("mark only pairs that make 5 or 10, with no cages", () => {
    for (const difficulty of difficulties) {
      const { content } = sudokuXvGenerators[1](`marks-${difficulty}`, difficulty);
      expect(content.cages).toBeUndefined();
      expect(content.xv!.marks.length).toBeGreaterThan(0);
    }
  }, 60_000);
});

const SEEDS = 100;
const BATCH = 10;
const batches = difficulties.flatMap((difficulty) =>
  Array.from({ length: SEEDS / BATCH }, (_, batch) => ({
    difficulty,
    from: batch * BATCH,
    to: (batch + 1) * BATCH,
  })),
);

describe.each(variants)("$name property", ({ versions }) => {
  it.each(batches)(
    "difficulty $difficulty, seeds $from to $to: each unique and solved by technique alone",
    ({ difficulty, from, to }) => {
      for (let index = from; index < to; index++) {
        const { content } = versions[1](`property-${index}`, difficulty);
        verifySudoku(content);
        expect(
          gradeSudoku(
            gridFromGivens(content.givens),
            5,
            classicUnits,
            variantFor({ cages: content.cages, xv: content.xv }),
          )?.difficulty,
        ).toBe(difficulty);
      }
    },
    300_000,
  );
});
