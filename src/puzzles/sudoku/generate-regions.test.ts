import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { regenerate } from "../generators";
import { gridFromGivens, unitsFor } from "./engine";
import {
  sudokuJigsawGenerators,
  sudokuRainbowGenerators,
} from "./generate-regions";
import { gradeSudoku } from "./grade";
import { contentSchema } from "./schema";
import { verifySudoku } from "./verify";

const variants = [
  { name: "sudoku-jigsaw", versions: sudokuJigsawGenerators },
  { name: "sudoku-rainbow", versions: sudokuRainbowGenerators },
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

  it("builds a well-formed region layout of the right kind", () => {
    for (const difficulty of difficulties) {
      const { content } = versions[1](`layout-${difficulty}`, difficulty);
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect(content.regions?.kind).toBe(name.replace("sudoku-", ""));
      verifySudoku(content);
    }
  });
});

describe("jigsaw layouts", () => {
  it("have no region that is a line, and differ from seed to seed", () => {
    const layouts = new Set<string>();
    for (let index = 0; index < 20; index++) {
      const { content } = sudokuJigsawGenerators[1](`shape-${index}`, 1);
      const regions = content.regions!.cells;
      layouts.add(regions.map(({ region }) => region).join(""));
      for (let region = 0; region < 9; region++) {
        const cells = regions.filter((cell) => cell.region === region);
        expect(new Set(cells.map(({ row }) => row)).size).toBeGreaterThan(1);
        expect(new Set(cells.map(({ col }) => col)).size).toBeGreaterThan(1);
      }
    }
    expect(layouts.size).toBe(20);
  });
});

describe("rainbow layouts", () => {
  it("deal every colour group one cell of each box", () => {
    for (let index = 0; index < 20; index++) {
      const { content } = sudokuRainbowGenerators[1](`groups-${index}`, 1);
      const boxesOf = new Map<number, Set<number>>();
      for (const { row, col, region } of content.regions!.cells) {
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        boxesOf.set(region, (boxesOf.get(region) ?? new Set()).add(box));
      }
      for (const boxes of boxesOf.values()) expect(boxes.size).toBe(9);
    }
  });
});

describe.each(variants)("$name property", ({ versions }) => {
  it.each(difficulties)(
    "difficulty %i: 100 seeds, each unique and solved by technique alone",
    (difficulty) => {
      for (let index = 0; index < 100; index++) {
        const { content } = versions[1](`property-${index}`, difficulty);
        verifySudoku(content);
        expect(
          gradeSudoku(
            gridFromGivens(content.givens),
            5,
            unitsFor(content.regions),
          )?.difficulty,
        ).toBe(difficulty);
      }
    },
    300_000,
  );
});
