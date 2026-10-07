import { describe, expect, it } from "vitest";
import type { Difficulty } from "../_shared/generate/pipeline";
import { countSolutions } from "./engine";
import { payload } from "./fixture";
import { gradeFutoshiki } from "./grade";

const latin = ["1234", "2143", "3412", "4321"];

describe("gradeFutoshiki", () => {
  it("grades a nearly complete Latin square as 1", () => {
    const givens = latin
      .flatMap((line, row) =>
        [...line].map((char, col) => ({ row, col, digit: Number(char) })),
      )
      .filter(({ row, col }) => row !== col);
    expect(gradeFutoshiki({ size: 4, givens, inequalities: [] })).toMatchObject(
      { difficulty: 1, hardest: "naked single" },
    );
  });

  it("grades the fixture by technique, and null under a lower limit than it needs", () => {
    expect(countSolutions(payload, 2)).toBe(1);
    const grade = gradeFutoshiki(payload);
    expect(grade).not.toBeNull();
    const needed = grade?.difficulty ?? 1;
    if (needed > 1) {
      expect(gradeFutoshiki(payload, (needed - 1) as Difficulty)).toBeNull();
    }
  });

  it("returns null for a puzzle with no clues, which needs a guess", () => {
    expect(
      gradeFutoshiki({ size: 4, givens: [], inequalities: [] }),
    ).toBeNull();
  });
});
