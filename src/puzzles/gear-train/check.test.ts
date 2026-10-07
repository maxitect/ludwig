import { describe, expect, it } from "vitest";
import { solve, validate } from "./engine";
import { check } from "./check";
import { planted, plantedSolution } from "./fixture";
import { verifyGearTrain } from "./verify";
import { payloadSchema } from "./schema";

const solution = { cogs: plantedSolution };

describe("check", () => {
  it("accepts the stored placement, in any order", () => {
    expect(check(planted, solution, { cogs: plantedSolution })).toEqual({
      correct: true,
    });
    expect(
      check(planted, solution, { cogs: [...plantedSolution].reverse() }),
    ).toEqual({ correct: true });
  });

  it("rejects an invalid placement and names the rule", () => {
    expect(
      check(planted, solution, { cogs: [{ row: 3, col: 2, teeth: 8 }] }),
    ).toEqual({ correct: false, brokenRule: 3 });
  });

  it("rejects a valid placement that is not the stored one", () => {
    const open = { ...planted, bolts: [] };
    const [other] = solve(open).filter(
      (found) => JSON.stringify(found) !== JSON.stringify(plantedSolution),
    );
    expect(validate(open, other)).toEqual({ ok: true });
    expect(check(open, solution, { cogs: other })).toEqual({ correct: false });
  });

  it("rejects the stored placement with a decoy swapped in", () => {
    const decoy = [
      ...plantedSolution.slice(0, 3),
      { row: 5, col: 7, teeth: 16 as const },
    ];
    expect(check(planted, solution, { cogs: decoy }).correct).toBe(false);
  });
});

describe("payload", () => {
  it("carries no solution", () => {
    expect(payloadSchema.strict().safeParse(planted).success).toBe(true);
    expect(
      payloadSchema
        .strict()
        .safeParse({ ...planted, solution: plantedSolution }).success,
    ).toBe(false);
    expect(
      payloadSchema.strict().safeParse({ ...planted, cogs: plantedSolution })
        .success,
    ).toBe(false);
  });
});

describe("verifyGearTrain", () => {
  it("accepts the planted puzzle", () => {
    expect(() =>
      verifyGearTrain({ ...planted, solution: plantedSolution }),
    ).not.toThrow();
  });

  it("rejects a puzzle with two placements", () => {
    expect(() =>
      verifyGearTrain({ ...planted, bolts: [], solution: plantedSolution }),
    ).toThrow(/exactly 1 placement, found 2/);
  });

  it("rejects a stored placement that is not valid", () => {
    expect(() =>
      verifyGearTrain({
        ...planted,
        solution: [{ row: 3, col: 2, teeth: 8 }],
      }),
    ).toThrow(/rule 3/);
  });
});
