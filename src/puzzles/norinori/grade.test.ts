import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { content as lockedRoom } from "../../../content/norinori/locked-room";
import { countSolutions, layoutOf, solve } from "./engine";
import { gradeNorinori, solveNorinori } from "./grade";
import type { Content } from "./schema";
import { regionCells } from "./verify";

/** One bare domino clears its neighbours, and from there every region is left with exactly the two cells it needs. */
const easy = {
  rows: 5,
  cols: 5,
  grid: ["40022", "42222", "42231", "44331", "44333"],
};

const layout = (content: Pick<Content, "rows" | "cols" | "grid">) =>
  layoutOf({ ...content, regions: regionCells(content) });

const contentDir = path.resolve(
  import.meta.dirname,
  "../../../content/norinori",
);
const contents = await Promise.all(
  readdirSync(contentDir).map(
    async (file) =>
      (await import(path.join(contentDir, file))) as { content: Content },
  ),
);

describe("gradeNorinori", () => {
  it("grades a puzzle that regions of two and domino completion finish as 1", () => {
    expect(countSolutions(layout(easy), 2)).toBe(1);
    expect(gradeNorinori(easy)).toMatchObject({ difficulty: 1 });
  });

  it("grades a puzzle that needs two regions taken together as 5, and null below it", () => {
    expect(countSolutions(layout(lockedRoom), 2)).toBe(1);
    const grade = gradeNorinori(lockedRoom);
    expect(grade?.difficulty).toBe(5);
    expect(grade?.uses["region overlap"]).toBeGreaterThan(0);
    expect(gradeNorinori(lockedRoom, 4)).toBeNull();
  });

  it("shades exactly the cells of the unique solution", () => {
    for (const content of [easy, ...contents.map(({ content }) => content)]) {
      const solved = solveNorinori(content);
      expect(solved?.shaded).toEqual(
        solve(layout(content))?.toSorted((a, b) => a - b),
      );
    }
  });

  it("returns null for a puzzle with several solutions, which needs a guess", () => {
    const loose = {
      rows: 5,
      cols: 5,
      grid: ["00000", "11111", "22222", "33333", "44444"],
    };
    expect(countSolutions(layout(loose), 2)).toBe(2);
    expect(gradeNorinori(loose)).toBeNull();
  });
});
