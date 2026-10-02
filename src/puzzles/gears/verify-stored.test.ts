import { describe, expect, it } from "vitest";
import { solveAll } from "./engine";
import { diagramOf, generateDiagram } from "./generate";
import { verifyStored } from "./verify-stored";

const content = generateDiagram("2026-11-03", "hard");
const diagram = diagramOf(content);
const solution = {
  crank: content.solution.crank,
  convergence: content.solution.convergence,
  killerGearId: content.solution.killerLabel,
  swaps: [],
};

describe("verifyStored", () => {
  it("accepts a generated diagram with its stored solution", () => {
    expect(() => verifyStored(diagram, solution)).not.toThrow();
  });

  it("rejects a stored solution that is not the solved one", () => {
    expect(() =>
      verifyStored(diagram, { ...solution, convergence: (solution.convergence % 8) + 1 }),
    ).toThrow(/differs/);
  });

  it("rejects a diagram edited so it no longer has exactly one solution", () => {
    const edited = {
      ...diagram,
      gears: diagram.gears.map((gear, i) =>
        i === 0 ? { ...gear, initialOffset: gear.initialOffset + 1 } : gear,
      ),
    };
    expect(solveAll(edited).length).not.toBe(1);
    expect(() => verifyStored(edited, solution)).toThrow();
  });
});
