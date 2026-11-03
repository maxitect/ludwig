import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { kakuroGenerators } from "./generate";
import { KAKURO_SLICES } from "./generate.property";
import { contentSchema } from "./schema";

describe("kakuro generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = kakuroGenerators[1]("same", 2);
    expect(kakuroGenerators[1]("same", 2)).toEqual(first);
    expect(kakuroGenerators[1]("other", 2).content).not.toEqual(first.content);
    expect(
      regenerate({ generator: "kakuro", version: 1, seed: "same" }, 2),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(kakuroGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "kakuro", version: 2, seed: "same" }, 2),
    ).toThrow(/version/);
  });

  it("keeps every puzzle schema-valid", () => {
    for (const difficulty of difficulties) {
      const { content } = kakuroGenerators[1](
        `shape-${difficulty}`,
        difficulty,
      );
      expect(contentSchema.safeParse(content).success).toBe(true);
    }
  }, 120_000);
});

describe("kakuro property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(
      KAKURO_SLICES,
    );
  });
});
