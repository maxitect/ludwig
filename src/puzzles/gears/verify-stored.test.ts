import { describe, expect, it } from "vitest";
import { solveAll } from "./engine";
import { diagramOf, generateDiagram, generateFixVariant } from "./generate";
import { verifyContent, verifyStored } from "./verify-stored";

const content = generateDiagram("2026-11-03", "hard");
const diagram = diagramOf(content);
const solution = {
  crank: content.solution.crank,
  convergence: content.solution.convergence,
  killerGearId: content.solution.killerLabel,
  swaps: [],
};

describe("verifyContent", () => {
  const fix = generateFixVariant("2026-11-03", "easy", 1);

  it("accepts a plain diagram and a Fix the Diagram variant", () => {
    expect(() => verifyContent(content)).not.toThrow();
    expect(() => verifyContent(fix)).not.toThrow();
  });

  it("rejects a Fix the Diagram variant whose repair is wrong", () => {
    const [swap] = fix.solution.swaps;
    const other = fix.gears.find(
      (gear) => gear.label !== swap!.a && gear.label !== swap!.b,
    )!;
    const wrong = {
      ...fix,
      solution: { ...fix.solution, swaps: [{ a: swap!.a, b: other.label }] },
    };
    expect(() => verifyContent(wrong)).toThrow();
  });

  it("rejects a Fix the Diagram variant that stores no repair", () => {
    expect(() =>
      verifyContent({ ...fix, solution: { ...fix.solution, swaps: [] } }),
    ).toThrow(/store its repair/);
  });

  it("rejects a plain diagram that stores swaps", () => {
    expect(() =>
      verifyContent({
        ...content,
        solution: { ...content.solution, swaps: fix.solution.swaps },
      }),
    ).toThrow(/without adjustments/);
  });
});

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
