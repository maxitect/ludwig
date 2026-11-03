import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { reflectionsGenerators } from "./generate";
import { REFLECTIONS_SLICES } from "./generate.property";
import { contentSchema } from "./schema";

describe("reflections generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = reflectionsGenerators[1]("same", 2);
    expect(reflectionsGenerators[1]("same", 2)).toEqual(first);
    expect(reflectionsGenerators[1]("other", 2).content).not.toEqual(
      first.content,
    );
    expect(
      regenerate({ generator: "reflections", version: 1, seed: "same" }, 2),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(reflectionsGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "reflections", version: 2, seed: "same" }, 2),
    ).toThrow(/version/);
  });

  it("keeps every puzzle schema-valid (4x4 to 10x10), with every letter on two ports", () => {
    for (const difficulty of difficulties.filter((d) => d <= 3)) {
      const { content } = reflectionsGenerators[1](
        `shape-${difficulty}`,
        difficulty,
      );
      expect(contentSchema.safeParse(content).success).toBe(true);
      const labels = Map.groupBy(content.ports, ({ label }) => label);
      expect(labels.size).toBeGreaterThanOrEqual(2);
      for (const ports of labels.values()) expect(ports).toHaveLength(2);
    }
  });
});

describe("reflections property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(
      REFLECTIONS_SLICES,
    );
  });
});
