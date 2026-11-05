import { describe, expect, it } from "vitest";
import { solveAll } from "./engine";
import { diagramOf, generateDailyDiagram } from "./generate";
import { gearCap } from "./limits";
import { dailyPresets, difficulties } from "./presets";

const SEEDS = 100;

describe("generateDailyDiagram", () => {
  const diagrams = Array.from({ length: SEEDS }, (_, i) => {
    const difficulty = difficulties[i % difficulties.length]!;
    return {
      difficulty,
      content: generateDailyDiagram(`2027-03-${i}`, difficulty),
    };
  });

  it("AC1: uses at least three tooth sizes overall", () => {
    const sizes = new Set(
      diagrams.flatMap(({ content }) => content.gears.map((g) => g.teeth)),
    );
    expect(sizes.size).toBeGreaterThanOrEqual(3);
  });

  it("AC1: every diagram has exactly one solution and stays within the cap", () => {
    for (const { content } of diagrams) {
      expect(solveAll(diagramOf(content))).toHaveLength(1);
      expect(content.gears.length).toBeLessThanOrEqual(gearCap.maxGears);
      for (const { teeth } of content.gears) {
        expect(gearCap.teeth).toContain(teeth);
      }
    }
  });

  it("is deterministic per seed", () => {
    expect(generateDailyDiagram("2027-03-01", "hard")).toEqual(
      generateDailyDiagram("2027-03-01", "hard"),
    );
  });

  it("daily presets stay within the cap", () => {
    for (const preset of Object.values(dailyPresets)) {
      expect(preset.gears.max).toBeLessThanOrEqual(gearCap.maxGears);
      for (const teeth of preset.teeth) expect(gearCap.teeth).toContain(teeth);
    }
  });
});
