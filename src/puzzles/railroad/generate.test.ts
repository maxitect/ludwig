import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { trace } from "./engine";
import { MIN_BEND_SHARE, railroadGenerators } from "./generate";
import { RAILROAD_SLICES } from "./generate.property";
import { solveRailroad } from "./grade";
import { contentSchema } from "./schema";

describe("railroad generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = railroadGenerators[1]("same", 3);
    expect(railroadGenerators[1]("same", 3)).toEqual(first);
    expect(railroadGenerators[1]("other", 3).content).not.toEqual(
      first.content,
    );
    expect(
      regenerate({ generator: "railroad", version: 1, seed: "same" }, 3),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(railroadGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "railroad", version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });

  it("keeps the size in range and the track bendy", () => {
    for (const difficulty of difficulties) {
      const { content } = railroadGenerators[1](
        `shape-${difficulty}`,
        difficulty,
      );
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect(content.rows).toBeGreaterThanOrEqual(4);
      expect(content.rows).toBeLessThanOrEqual(10);
      const track = solveRailroad(content)!.pieces;
      expect(trace(content, track).reachesExit).toBe(true);
      const bends = track.filter(
        ({ piece }) => piece !== "ns" && piece !== "ew",
      );
      expect(bends.length).toBeGreaterThanOrEqual(
        MIN_BEND_SHARE * track.length,
      );
    }
  });
});

describe("railroad property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate")).toBe(
      RAILROAD_SLICES,
    );
  });
});
