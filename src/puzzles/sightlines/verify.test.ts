import { describe, expect, it } from "vitest";
import type { Content } from "./schema";
import { verifySightlines } from "./verify";

const good: Content = {
  grid: ["...#.", ".....", "....."],
  targetRow: 0,
  targetCol: 4,
  observers: [{ row: 0, col: 0, facing: "e", fovDeg: 90 }],
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
        observers: [{ row: 0, col: 0, facing: "e", fovDeg: 360 }],
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
        observers: [{ row: 0, col: 9, facing: "e", fovDeg: 90 }],
      }),
    ).toThrow(/observer at \(0, 9\) is out of bounds/);
  });

  it("rejects an observer on a pillar", () => {
    expect(() =>
      verifySightlines({
        ...good,
        observers: [{ row: 0, col: 3, facing: "w", fovDeg: 90 }],
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
    const observer = { row: 0, col: 0, facing: "e", fovDeg: 90 } as const;
    expect(() =>
      verifySightlines({ ...good, observers: [observer, observer] }),
    ).toThrow(/two observers/);
  });

  it("rejects a grid that is not full", () => {
    expect(() =>
      verifySightlines({ ...good, grid: ["...#.", "....", "....."] }),
    ).toThrow(/grid is not full: row 2 has 4 cells/);
  });
});
