import { describe, expect, it } from "vitest";
import { check } from "./check";
import {
  type Answer,
  answerSchema,
  type Payload,
  type Solution,
} from "./schema";

const gear = (label: string, teeth: number, isDriver = false) => ({
  id: label,
  label,
  teeth,
  startSlot: 0,
  initialOffset: 0,
  halfWidthDeg: 45,
  isDriver,
});

const payload: Payload = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  maxAdjustments: 2,
  occlusion: false,
  gears: [gear("A", 8, true), gear("B", 12), gear("C", 16)],
  meshes: [],
};
const solution: Solution = {
  crank: 4,
  convergence: 5,
  killerGearId: "B",
  swaps: [],
};

const run = (crank: number, convergence: number, accusedGearId: string) =>
  check(payload, solution, { crank, convergence, accusedGearId, swaps: [] });

describe("check", () => {
  it("AC1: accepts the solution and the same crank modulo lcm(teeth) = 48", () => {
    expect(run(4, 5, "B")).toEqual({ correct: true });
    expect(run(52, 5, "B")).toEqual({ correct: true });
  });

  it("AC1: rejects a wrong killer, convergence or crank", () => {
    expect(run(4, 5, "A").correct).toBe(false);
    expect(run(4, 4, "B").correct).toBe(false);
    expect(run(5, 5, "B").correct).toBe(false);
  });

  it("returns only { correct }", () => {
    expect(Object.keys(run(4, 5, "B"))).toEqual(["correct"]);
  });

  it("throws for a gear that is not in the puzzle", () => {
    expect(() => run(4, 5, "Z")).toThrow(/does not belong/);
  });
});

describe("check swaps", () => {
  const fixPayload: Payload = {
    ...payload,
    maxAdjustments: 1,
    gears: [
      gear("A", 8, true),
      gear("B", 12),
      gear("C", 16),
      gear("D", 8),
      gear("E", 8),
    ],
  };
  const fixSolution: Solution = {
    ...solution,
    swaps: [{ gearAId: "C", gearBId: "E" }],
  };
  const runSwaps = (swaps: Answer["swaps"]) =>
    check(fixPayload, fixSolution, {
      crank: 4,
      convergence: 5,
      accusedGearId: "B",
      swaps,
    }).correct;

  it("AC1: accepts the solution swap in either order", () => {
    expect(runSwaps([{ gearAId: "C", gearBId: "E" }])).toBe(true);
    expect(runSwaps([{ gearAId: "E", gearBId: "C" }])).toBe(true);
  });

  it("AC1: rejects another pair, no swaps and extra swaps", () => {
    expect(runSwaps([{ gearAId: "C", gearBId: "D" }])).toBe(false);
    expect(runSwaps([])).toBe(false);
    expect(
      runSwaps([
        { gearAId: "C", gearBId: "E" },
        { gearAId: "A", gearBId: "B" },
      ]),
    ).toBe(false);
  });

  it("rejects a swap on a puzzle with none", () => {
    expect(
      check(payload, solution, {
        crank: 4,
        convergence: 5,
        accusedGearId: "B",
        swaps: [{ gearAId: "A", gearBId: "B" }],
      }).correct,
    ).toBe(false);
  });
});

describe("answerSchema", () => {
  const answer = {
    crank: 4,
    convergence: 5,
    accusedGearId: "3f5d8c7a-5d1e-4b3a-9c1d-0a1b2c3d4e5f",
    swaps: [],
  };

  it("accepts convergences 1 to 8 only", () => {
    expect(answerSchema.safeParse(answer).success).toBe(true);
    expect(answerSchema.safeParse({ ...answer, convergence: 9 }).success).toBe(
      false,
    );
    expect(answerSchema.safeParse({ ...answer, convergence: 0 }).success).toBe(
      false,
    );
  });

  it("rejects a negative crank", () => {
    expect(answerSchema.safeParse({ ...answer, crank: -44 }).success).toBe(
      false,
    );
  });
});
