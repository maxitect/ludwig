import { describe, expect, it } from "vitest";
import { canStep, deriveSeen, hasWall } from "./derive";
import type { Content } from "./schema";

const layout: Pick<Content, "rows" | "cols" | "walls" | "cameras"> = {
  rows: 3,
  cols: 3,
  walls: [
    { row: 1, col: 1, side: "north" },
    { row: 1, col: 1, side: "west" },
  ],
  cameras: [{ row: 1, col: 0, facing: "e", fovDeg: 90, rangeCells: 2 }],
};

describe("wall semantics", () => {
  it("reads a stored wall from the cell it is stored on", () => {
    expect(hasWall(layout, 1, 1, "north")).toBe(true);
    expect(hasWall(layout, 1, 1, "west")).toBe(true);
  });

  it("derives the south and east walls from the neighbours", () => {
    expect(hasWall(layout, 0, 1, "south")).toBe(true);
    expect(hasWall(layout, 1, 0, "east")).toBe(true);
    expect(hasWall(layout, 1, 1, "south")).toBe(false);
    expect(hasWall(layout, 1, 1, "east")).toBe(false);
  });

  it("treats the outer boundary as a wall on every side", () => {
    expect(hasWall(layout, 0, 0, "north")).toBe(true);
    expect(hasWall(layout, 0, 0, "west")).toBe(true);
    expect(hasWall(layout, 2, 2, "south")).toBe(true);
    expect(hasWall(layout, 2, 2, "east")).toBe(true);
    expect(hasWall(layout, 0, 2, "north")).toBe(true);
    expect(hasWall(layout, 2, 0, "west")).toBe(true);
  });

  it("lets a step cross an open edge only, in both directions", () => {
    expect(canStep(layout, { row: 1, col: 1 }, { row: 1, col: 2 })).toBe(true);
    expect(canStep(layout, { row: 1, col: 2 }, { row: 1, col: 1 })).toBe(true);
    expect(canStep(layout, { row: 0, col: 1 }, { row: 1, col: 1 })).toBe(false);
    expect(canStep(layout, { row: 1, col: 1 }, { row: 0, col: 1 })).toBe(false);
    expect(canStep(layout, { row: 1, col: 0 }, { row: 1, col: 1 })).toBe(false);
    expect(canStep(layout, { row: 1, col: 1 }, { row: 1, col: 0 })).toBe(false);
  });

  it("rejects a diagonal, a jump, a standstill and a step off the board", () => {
    expect(canStep(layout, { row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
    expect(canStep(layout, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
    expect(canStep(layout, { row: 0, col: 0 }, { row: 0, col: 0 })).toBe(false);
    expect(canStep(layout, { row: 0, col: 0 }, { row: -1, col: 0 })).toBe(false);
  });
});

describe("deriveSeen", () => {
  it("sees the camera's cell and the cone cells in range, through the walls", () => {
    expect(deriveSeen(layout)).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
    ]);
  });

  it("sees nothing without cameras", () => {
    expect(deriveSeen({ ...layout, cameras: [] })).toEqual([]);
  });

  it("joins the cones of several cameras once each", () => {
    const seen = deriveSeen({
      ...layout,
      cameras: [
        ...layout.cameras,
        { row: 1, col: 2, facing: "w", fovDeg: 90, rangeCells: 1 },
      ],
    });
    expect(seen).toHaveLength(5);
  });
});
