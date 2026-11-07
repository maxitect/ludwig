import { describe, expect, it } from "vitest";
import type { Content } from "./schema";
import { verifySightlines } from "./verify";

const good: Content = {
  brief: "Mark the blind spots.",
  grid: ["...#.", ".....", "....."],
  targetRow: 0,
  targetCol: 4,
  observers: [{ row: 0, col: 0, facing: "e", fovDeg: 90, name: "Observer 1" }],
};

describe("verifySightlines", () => {
  it("accepts a layout whose target is a blind spot", () => {
    expect(() => verifySightlines(good)).not.toThrow();
  });

  it("rejects a target that an observer can see", () => {
    expect(() => verifySightlines({ ...good, targetCol: 1 })).toThrow(
      /is seen by an observer/,
    );
  });

  it("rejects a layout with no blind spot", () => {
    expect(() =>
      verifySightlines({
        ...good,
        observers: [
          { row: 0, col: 0, facing: "e", fovDeg: 360, name: "Observer 2" },
        ],
        grid: ["...#.", ".....", "....."].map((line) => line.replace("#", ".")),
      }),
    ).toThrow(/no cell is a blind spot/);
  });

  it("rejects a target out of bounds", () => {
    expect(() => verifySightlines({ ...good, targetRow: 3 })).toThrow(
      /out of bounds/,
    );
  });

  it("rejects an observer out of bounds", () => {
    expect(() =>
      verifySightlines({
        ...good,
        observers: [
          { row: 0, col: 9, facing: "e", fovDeg: 90, name: "Observer 3" },
        ],
      }),
    ).toThrow(/observer at \(0, 9\) is out of bounds/);
  });

  it("rejects an observer on a pillar", () => {
    expect(() =>
      verifySightlines({
        ...good,
        observers: [
          { row: 0, col: 3, facing: "w", fovDeg: 90, name: "Observer 4" },
        ],
      }),
    ).toThrow(/stands on a pillar/);
  });

  it("rejects a target on a pillar", () => {
    expect(() => verifySightlines({ ...good, targetCol: 3 })).toThrow(
      /target .* is on a pillar/,
    );
  });

  it("rejects a layout with no observers", () => {
    expect(() => verifySightlines({ ...good, observers: [] })).toThrow(
      /no observers/,
    );
  });

  it("rejects two observers on one cell", () => {
    const observer = {
      row: 0,
      col: 0,
      facing: "e",
      fovDeg: 90,
      name: "Observer 5",
    } as const;
    expect(() =>
      verifySightlines({ ...good, observers: [observer, observer] }),
    ).toThrow(/two observers/);
  });

  it("rejects a grid that is not full", () => {
    expect(() =>
      verifySightlines({ ...good, grid: ["...#.", "....", "....."] }),
    ).toThrow(/grid is not full: row 2 has 4 cells/);
  });

  it("rejects two observers with one name", () => {
    expect(() =>
      verifySightlines({
        ...good,
        observers: [
          ...good.observers,
          {
            row: 2,
            col: 4,
            facing: "w",
            fovDeg: 90,
            name: good.observers[0].name,
          },
        ],
      }),
    ).toThrow(/two observers are called/);
  });
});
