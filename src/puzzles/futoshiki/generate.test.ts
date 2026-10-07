import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { countSolutions } from "./engine";
import { futoshikiGenerators } from "./generate";
import { gradeFutoshiki } from "./grade";
import { contentSchema } from "./schema";

describe("futoshiki generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = futoshikiGenerators[1]("same", 3);
    expect(futoshikiGenerators[1]("same", 3)).toEqual(first);
    expect(futoshikiGenerators[1]("other", 3).content).not.toEqual(
      first.content,
    );
  });

  it("has no version 2 yet", () => {
    expect(Object.hasOwn(futoshikiGenerators, 2)).toBe(false);
  });

  it("produces unique puzzles solvable by technique alone, at the requested difficulty (200 seeds, the slow tier 5 on every twentieth)", () => {
    for (let index = 0; index < 200; index++) {
      const difficulty =
        index % 20 === 19 ? 5 : difficulties[index % (difficulties.length - 1)];
      const { content } = futoshikiGenerators[1](
        `property-${index}`,
        difficulty,
      );
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect(countSolutions(content, 2)).toBe(1);
      expect(gradeFutoshiki(content)?.difficulty).toBe(difficulty);
    }
  }, 120_000);
});
