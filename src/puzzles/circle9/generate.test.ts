import { describe, expect, it } from "vitest";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { circle9Generators } from "./generate";
import { CIRCLE9_SLICES } from "./generate.property";
import { contentSchema } from "./schema";

describe("circle9 generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = circle9Generators[1]("same", 3);
    expect(circle9Generators[1]("same", 3)).toEqual(first);
    expect(circle9Generators[1]("other", 3).content).not.toEqual(first.content);
    expect(
      regenerate({ generator: "circle9", version: 1, seed: "same" }, 3),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(circle9Generators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "circle9", version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });

  it("writes a grid the content schema accepts, with more numbers at higher difficulty", () => {
    const counts = [1, 2, 3, 4, 5].map((difficulty) => {
      const { content } = circle9Generators[1](`shape-${difficulty}`, difficulty as 1);
      expect(contentSchema.safeParse(content).success).toBe(true);
      return content.grid.join("").replace(/\./g, "").length;
    });
    expect(counts).toEqual([24, 30, 36, 42, 48]);
  });

  it("has a property slice file per slice", () => {
    expect(sliceFileCount(__dirname, "generate")).toBe(CIRCLE9_SLICES);
  });
});
