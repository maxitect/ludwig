import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { troixGenerators } from "./generate";
import { TROIX_SLICES } from "./generate.property";
import { contentSchema } from "./schema";

describe("troix generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = troixGenerators[1]("same", 3);
    expect(troixGenerators[1]("same", 3)).toEqual(first);
    expect(troixGenerators[1]("other", 3).content).not.toEqual(first.content);
    expect(
      regenerate({ generator: "troix", version: 1, seed: "same" }, 3),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(troixGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "troix", version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });

  it("makes 6 by 6 and 9 by 9 grids that fit the content schema", () => {
    const sizes = new Set<number>();
    for (const difficulty of difficulties) {
      for (let index = 0; index < 4; index++) {
        const { content } = troixGenerators[1](`shape-${index}`, difficulty);
        expect(contentSchema.safeParse(content).success).toBe(true);
        sizes.add(content.size);
      }
    }
    expect([...sizes].sort()).toEqual([6, 9]);
  });
});

describe("troix property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(TROIX_SLICES);
  });
});
