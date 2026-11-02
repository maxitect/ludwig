import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { norinoriGenerators } from "./generate";
import { NORINORI_SLICES } from "./generate.property";
import { contentSchema } from "./schema";

describe("norinori generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = norinoriGenerators[1]("same", 2);
    expect(norinoriGenerators[1]("same", 2)).toEqual(first);
    expect(norinoriGenerators[1]("other", 2).content).not.toEqual(
      first.content,
    );
    expect(
      regenerate({ generator: "norinori", version: 1, seed: "same" }, 2),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(norinoriGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "norinori", version: 2, seed: "same" }, 2),
    ).toThrow(/version/);
  });

  it("keeps every puzzle schema-valid with regions of at least two cells", () => {
    for (const difficulty of difficulties) {
      const { content } = norinoriGenerators[1](`shape-${difficulty}`, difficulty);
      expect(contentSchema.safeParse(content).success).toBe(true);
      const sizes = new Map<string, number>();
      for (const digit of content.grid.join("")) {
        sizes.set(digit, (sizes.get(digit) ?? 0) + 1);
      }
      for (const size of sizes.values()) expect(size).toBeGreaterThan(1);
    }
  });
});

describe("norinori property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(
      NORINORI_SLICES,
    );
  });
});
