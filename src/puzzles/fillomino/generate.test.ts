import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { fillominoGenerators } from "./generate";
import { FILLOMINO_SLICES } from "./generate.property";
import { solveFillomino } from "./grade";
import { contentSchema } from "./schema";

describe("fillomino generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = fillominoGenerators[1]("same", 2);
    expect(fillominoGenerators[1]("same", 2)).toEqual(first);
    expect(fillominoGenerators[1]("other", 2).content).not.toEqual(
      first.content,
    );
    expect(
      regenerate({ generator: "fillomino", version: 1, seed: "same" }, 2),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(fillominoGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "fillomino", version: 2, seed: "same" }, 2),
    ).toThrow(/version/);
  });

  it("makes 8 by 8 and 10 by 10 grids that parse, with no more than two one-cell areas", () => {
    for (const difficulty of difficulties) {
      const { content } = fillominoGenerators[1](
        `shape-${difficulty}`,
        difficulty,
      );
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect([8, 10]).toContain(content.rows);
      expect(content.cols).toBe(content.rows);
      const solution = solveFillomino(content)?.cells ?? [];
      expect(solution).toHaveLength(content.rows * content.cols);
      expect(
        solution.filter((digit) => digit === 1).length,
      ).toBeLessThanOrEqual(2);
    }
  });
});

describe("fillomino property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(
      FILLOMINO_SLICES,
    );
  });
});
