import { describe, expect, it } from "vitest";
import { content as bufferStop } from "../../../content/railroad/buffer-stop";
import { countSolutions, solve } from "./engine";
import { payload } from "./fixture";
import { gradeRailroad, solveRailroad } from "./grade";

const loose = { ...payload, rowCounts: [3, 3, 4, 3], colCounts: [4, 4, 3, 2], given: [] };

describe("gradeRailroad", () => {
  it("grades a puzzle that the counts and the bends finish as 1", () => {
    expect(countSolutions(payload)).toBe(1);
    expect(gradeRailroad(payload)).toMatchObject({
      difficulty: 1,
      hardest: "row and column counts",
    });
  });

  it("grades a puzzle that needs a contradiction on a piece of track as 4 or more", () => {
    expect(countSolutions(bufferStop)).toBe(1);
    const grade = gradeRailroad(bufferStop);
    expect(grade?.difficulty).toBeGreaterThanOrEqual(4);
    expect(grade?.uses["contradiction on a cell or piece"]).toBeGreaterThan(0);
    expect(gradeRailroad(bufferStop, 3)).toBeNull();
  });

  it("finds exactly the track of the unique solution", () => {
    for (const layout of [payload, bufferStop]) {
      expect(solveRailroad(layout)?.pieces).toHaveLength(solve(layout)!.length);
      expect(
        new Set(solveRailroad(layout)?.pieces.map((p) => JSON.stringify(p))),
      ).toEqual(new Set(solve(layout)!.map((p) => JSON.stringify(p))));
    }
  });

  it("returns null for clues with two tracks, which need a guess", () => {
    expect(countSolutions(loose)).toBe(2);
    expect(gradeRailroad(loose)).toBeNull();
  });
});
