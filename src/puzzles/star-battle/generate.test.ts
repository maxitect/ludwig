import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { regenerate } from "../generators";
import { starBattleGenerators } from "./generate";
import { solveStarBattle } from "./grade";
import { contentSchema } from "./schema";
import { verifyStarBattle } from "./verify";

describe("star battle generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = starBattleGenerators[1]("same", 3);
    expect(starBattleGenerators[1]("same", 3)).toEqual(first);
    expect(starBattleGenerators[1]("other", 3).content).not.toEqual(
      first.content,
    );
    expect(
      regenerate({ generator: "star-battle", version: 1, seed: "same" }, 3),
    ).toEqual(first);
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(starBattleGenerators, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: "star-battle", version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });

  it("keeps every size and star count in range, with no region of one cell", () => {
    for (const difficulty of difficulties) {
      const { content } = starBattleGenerators[1](`shape-${difficulty}`, difficulty);
      expect(contentSchema.safeParse(content).success).toBe(true);
      const cells = content.grid.join("");
      for (let region = 0; region < content.size; region++) {
        expect(
          [...cells].filter((digit) => Number(digit) === region).length,
        ).toBeGreaterThan(1);
      }
    }
  });
});

const SEEDS = 100;
const BATCH = 25;
const batches = difficulties.flatMap((difficulty) =>
  Array.from({ length: SEEDS / BATCH }, (_, batch) => ({
    difficulty,
    from: batch * BATCH,
    to: (batch + 1) * BATCH,
  })),
);

describe("star battle property", () => {
  it.each(batches)(
    "difficulty $difficulty, seeds $from to $to: each unique and solved by technique alone",
    ({ difficulty, from, to }) => {
      for (let index = from; index < to; index++) {
        const { content } = starBattleGenerators[1](
          `property-${index}`,
          difficulty,
        );
        verifyStarBattle(content);
        expect(solveStarBattle(content)?.grade.difficulty).toBe(difficulty);
      }
    },
    300_000,
  );
});
