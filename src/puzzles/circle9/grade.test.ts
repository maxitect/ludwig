import { describe, expect, it } from "vitest";
import { content as looseEnds } from "../../../content/circle9/loose-ends";
import { content as pencilCase } from "../../../content/circle9/pencil-case";
import { content as fullCircle } from "../../../content/circle9/full-circle";
import { countSolutions, layoutOf, solve } from "./engine";
import { gradeCircle9, solveCircle9 } from "./grade";
import { numbers } from "./verify";

const layout = (content: { grid: string[] }) =>
  layoutOf({ numbers: numbers(content) });

describe("gradeCircle9", () => {
  it("grades a puzzle that only-cell steps finish as 1", () => {
    expect(countSolutions(layout(looseEnds))).toBe(1);
    expect(gradeCircle9(layout(looseEnds))).toMatchObject({
      difficulty: 1,
      hardest: "only cell",
    });
  });

  it("grades a puzzle that needs a four-line fish as 5, and null below it", () => {
    const grade = gradeCircle9(layout(pencilCase));
    expect(grade?.difficulty).toBe(5);
    expect(grade?.uses["4 lines"]).toBeGreaterThan(0);
    expect(gradeCircle9(layout(pencilCase), 4)).toBeNull();
  });

  it("circles exactly the cells of the unique solution", () => {
    for (const content of [looseEnds, pencilCase]) {
      expect(solveCircle9(layout(content))?.circled).toEqual(
        solve(layout(content)),
      );
    }
  });

  it("returns null for a grid with no solution, and for a puzzle above the limit", () => {
    const grid = [
      "123......",
      "456......",
      "789......",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
    ];
    expect(countSolutions(layout({ grid }))).toBe(0);
    expect(gradeCircle9(layout({ grid }))).toBeNull();
    expect(gradeCircle9(layout(fullCircle), 1)).toBeNull();
  });
});
