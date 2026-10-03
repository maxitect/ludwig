import { describe, expect, it } from "vitest";
import { check } from "./check";
import { generateScene, regionCentre } from "./engine";
import type { Payload } from "./schema";

const solution = { sceneSeed: 1902, differenceCount: 6, generatorVersion: 1 };
const payload = {} as Payload;
const { differences } = generateScene(1902, 6, 1);
const centres = differences.map(({ region }) => regionCentre(region));

describe("spot-difference check", () => {
  it("accepts a tap in every region", () => {
    expect(check(payload, solution, { taps: centres }).correct).toBe(true);
  });

  it("accepts the taps in any order, with extra misses", () => {
    expect(
      check(payload, solution, {
        taps: [{ x: 0, y: 0 }, ...[...centres].reverse()],
      }).correct,
    ).toBe(true);
  });

  it("rejects when one region is missed", () => {
    expect(check(payload, solution, { taps: centres.slice(1) }).correct).toBe(
      false,
    );
  });

  it("rejects repeated taps in the same region", () => {
    expect(
      check(payload, solution, { taps: Array(6).fill(centres[0]) }).correct,
    ).toBe(false);
  });

  it("rejects taps outside every region", () => {
    expect(
      check(payload, solution, { taps: [{ x: 0, y: 0 }] }).correct,
    ).toBe(false);
  });
});
