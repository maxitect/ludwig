import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { starBattleGenerators } from "./generate";
import { solveStarBattle } from "./grade";
import { verifyStarBattle } from "./verify";

export const STAR_BATTLE_SLICES = 3;

export function starBattleProperty(slice: number) {
  propertySlice(
    ["star battle"] as const,
    { seeds: 100, batch: 25, slices: STAR_BATTLE_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = starBattleGenerators[1](seed, difficulty);
      verifyStarBattle(content);
      expect(solveStarBattle(content)?.grade.difficulty).toBe(difficulty);
    },
  );
}
