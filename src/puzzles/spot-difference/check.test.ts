import { describe, expect, it } from "vitest";
import { check } from "./check";
import { regionCentre } from "./regions";
import type { Payload, Solution } from "./schema";

const payload = {} as Payload;
const solution: Solution = [
  { x: 10, y: 10, width: 40, height: 30 },
  { x: 200, y: 120, width: 60, height: 60 },
  { x: 500, y: 300, width: 20, height: 20 },
].map((region, index) => ({ index, region }));
const centres = solution.map(({ region }) => regionCentre(region));

describe("spot-difference check", () => {
  it("accepts a tap in every region", () => {
    expect(check(payload, solution, { taps: centres }).correct).toBe(true);
  });

  it("accepts the taps in any order, with extra misses", () => {
    expect(
      check(payload, solution, {
        taps: [{ x: 0, y: 900 }, ...[...centres].reverse()],
      }).correct,
    ).toBe(true);
  });

  it("counts a tap on a region's edge", () => {
    const { x, y } = solution[0].region;
    expect(
      check(payload, solution, { taps: [{ x, y }, ...centres.slice(1)] })
        .correct,
    ).toBe(true);
  });

  it("rejects when one region is missed", () => {
    expect(check(payload, solution, { taps: centres.slice(1) }).correct).toBe(
      false,
    );
  });

  it("rejects repeated taps in the same region", () => {
    expect(
      check(payload, solution, { taps: Array(3).fill(centres[0]) }).correct,
    ).toBe(false);
  });

  it("rejects taps outside every region", () => {
    expect(
      check(payload, solution, { taps: [{ x: 0, y: 900 }] }).correct,
    ).toBe(false);
  });
});
