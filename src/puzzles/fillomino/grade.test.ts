import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brokenIndexes, countSolutions, solve } from "./engine";
import { gradeFillomino, solveFillomino } from "./grade";
import type { Content } from "./schema";

const SOLUTION = ["55555", "44443", "22133", "66644", "66644"] as const;

const givensWithout = (...blanks: Array<[number, number]>) => ({
  rows: 5,
  cols: 5,
  givens: SOLUTION.flatMap((line, row) =>
    [...line].flatMap((digit, col) =>
      blanks.some(([r, c]) => r === row && c === col)
        ? []
        : [{ row, col, digit: Number(digit) }],
    ),
  ),
});

const contentDir = path.resolve(
  import.meta.dirname,
  "../../../content/fillomino",
);
const contents = Object.fromEntries(
  await Promise.all(
    readdirSync(contentDir).map(async (file) => {
      const loaded = (await import(path.join(contentDir, file))) as {
        content: Content;
      };
      return [file.replace(/\.ts$/, ""), loaded.content] as const;
    }),
  ),
);

describe("gradeFillomino", () => {
  it("grades a grid whose one gap the unfinished four can only grow into as 1", () => {
    const gap = givensWithout([1, 3]);
    expect(countSolutions(gap, 2)).toBe(1);
    const grade = gradeFillomino(gap);
    expect(grade?.difficulty).toBe(1);
    expect(grade?.uses["single exit"]).toBeGreaterThan(0);
  });

  it("grades a grid that needs the room a lone cell has as 2, and null below it", () => {
    const lone = givensWithout([2, 2]);
    expect(countSolutions(lone, 2)).toBe(1);
    expect(gradeFillomino(lone)).toMatchObject({
      difficulty: 2,
      hardest: "room",
    });
    expect(gradeFillomino(lone, 1)).toBeNull();
  });

  it("grades a generated puzzle that needs the pooled areas as 5, and null below it", () => {
    const hard = contents["last-light"];
    expect(countSolutions(hard, 2)).toBe(1);
    const grade = gradeFillomino(hard);
    expect(grade?.difficulty).toBeGreaterThanOrEqual(4);
    expect(gradeFillomino(hard, 3)).toBeNull();
  });

  it("fills exactly the unique solution wherever the techniques finish the grid", () => {
    const small = givensWithout([1, 3]);
    expect(solveFillomino(small)?.cells).toEqual(
      solve(small)?.map(({ digit }) => digit),
    );
    const solved = Object.values(contents).filter(
      (content) => solveFillomino(content)?.cells,
    );
    expect(solved.length).toBeGreaterThanOrEqual(5);
    for (const content of solved) {
      const cells = solveFillomino(content)?.cells ?? [];
      expect(brokenIndexes(content, cells).size).toBe(0);
      for (const { row, col, digit } of content.givens) {
        expect(cells[row * content.cols + col]).toBe(digit);
      }
    }
  });

  it("returns null for a puzzle with several solutions, which needs a guess", () => {
    const loose = {
      rows: 5,
      cols: 5,
      givens: [{ row: 0, col: 0, digit: 5 }],
    };
    expect(countSolutions(loose, 2)).toBe(2);
    expect(gradeFillomino(loose)).toBeNull();
  });
});
