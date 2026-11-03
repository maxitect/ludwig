import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { content as vanishingPoint } from "../../../content/reflections/vanishing-point";
import { countSolutions, solve } from "./engine";
import { gradeReflections, solveReflections } from "./grade";
import type { Content } from "./schema";

/**
 * A beam enters at the top of column 1 and meets the one slot heading south. A `/` turns it west
 * out of row 1, which is lettered; a `\` would turn it east, out of the wrong port.
 */
const easy: Content = {
  rows: 4,
  cols: 4,
  fixedMirrors: [],
  slots: [{ row: 1, col: 1 }],
  ports: [
    { side: "n", offset: 1, label: "A" },
    { side: "w", offset: 1, label: "A" },
  ],
};

const contentDir = path.resolve(
  import.meta.dirname,
  "../../../content/reflections",
);
const contents = await Promise.all(
  readdirSync(contentDir).map(
    async (file) =>
      (await import(path.join(contentDir, file))) as { content: Content },
  ),
);

describe("gradeReflections", () => {
  it("grades a puzzle that one forced turn finishes as 1", () => {
    expect(countSolutions(easy, 2)).toBe(1);
    expect(gradeReflections(easy)).toMatchObject({
      difficulty: 1,
      hardest: "beam forcing",
    });
    expect(solveReflections(easy)?.mirrors).toEqual([
      { row: 1, col: 1, mirror: "slash" },
    ]);
  });

  it("grades a puzzle that needs a mirror ruled out by another beam as 5, and null below it", () => {
    expect(countSolutions(vanishingPoint, 2)).toBe(1);
    expect(gradeReflections(vanishingPoint)?.difficulty).toBe(5);
    expect(solveReflections(vanishingPoint, 4)?.grade).toBeNull();
  });

  it("agrees with the engine's solution on every content file it solves", () => {
    let solved = 0;
    for (const { content } of contents) {
      const result = solveReflections(content);
      if (!result?.mirrors) continue;
      solved++;
      expect(result.mirrors).toEqual(solve(content));
    }
    expect(solved).toBe(contents.length);
  });

  it("is null for a puzzle no mirror choice can satisfy", () => {
    expect(
      gradeReflections({
        ...easy,
        ports: [
          { side: "n", offset: 1, label: "A" },
          { side: "e", offset: 3, label: "A" },
        ],
      }),
    ).toBeNull();
  });
});
