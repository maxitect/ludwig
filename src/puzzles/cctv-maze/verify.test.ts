import { describe, expect, it } from "vitest";
import type { Content } from "./schema";
import { verifyCctvMaze } from "./verify";

const good: Content = {
  rows: 3,
  cols: 3,
  startRow: 0,
  startCol: 0,
  exitRow: 0,
  exitCol: 2,
  walls: [{ row: 1, col: 1, side: "west" }],
  cameras: [{ row: 0, col: 1, facing: "s", fovDeg: 30, rangeCells: 1 }],
};

describe("verifyCctvMaze", () => {
  it("accepts a maze with exactly one shortest unseen path", () => {
    expect(() => verifyCctvMaze(good)).not.toThrow();
  });

  it("rejects two equal shortest unseen paths", () => {
    expect(() =>
      verifyCctvMaze({ ...good, exitRow: 1, exitCol: 1, walls: [], cameras: [] }),
    ).toThrow(/more than one shortest unseen path/);
  });

  it("rejects an unsolvable maze", () => {
    expect(() =>
      verifyCctvMaze({
        ...good,
        cameras: [
          { row: 1, col: 0, facing: "s", fovDeg: 30, rangeCells: 1 },
          { row: 0, col: 1, facing: "s", fovDeg: 30, rangeCells: 1 },
        ],
      }),
    ).toThrow(/no unseen path/);
  });

  it("rejects a seen start and a seen exit", () => {
    expect(() =>
      verifyCctvMaze({
        ...good,
        cameras: [{ row: 0, col: 0, facing: "n", fovDeg: 30, rangeCells: 1 }],
      }),
    ).toThrow(/the start \(0, 0\) is seen/);
    expect(() =>
      verifyCctvMaze({
        ...good,
        cameras: [{ row: 0, col: 2, facing: "n", fovDeg: 30, rangeCells: 1 }],
      }),
    ).toThrow(/the exit \(0, 2\) is seen/);
  });

  it("rejects a start equal to the exit and out of bounds cells", () => {
    expect(() => verifyCctvMaze({ ...good, exitCol: 0 })).toThrow(/same cell/);
    expect(() => verifyCctvMaze({ ...good, startRow: 3 })).toThrow(
      /start \(3, 0\) is out of bounds/,
    );
    expect(() => verifyCctvMaze({ ...good, exitCol: 3 })).toThrow(
      /exit \(0, 3\) is out of bounds/,
    );
  });

  it("rejects walls out of bounds, on the boundary or listed twice", () => {
    expect(() =>
      verifyCctvMaze({ ...good, walls: [{ row: 3, col: 0, side: "north" }] }),
    ).toThrow(/out of bounds/);
    expect(() =>
      verifyCctvMaze({ ...good, walls: [{ row: 0, col: 1, side: "north" }] }),
    ).toThrow(/on the boundary/);
    expect(() =>
      verifyCctvMaze({ ...good, walls: [{ row: 1, col: 0, side: "west" }] }),
    ).toThrow(/on the boundary/);
    const wall = { row: 1, col: 1, side: "west" as const };
    expect(() => verifyCctvMaze({ ...good, walls: [wall, wall] })).toThrow(
      /listed twice/,
    );
  });

  it("rejects cameras out of bounds or sharing a cell", () => {
    const camera = good.cameras[0];
    expect(() =>
      verifyCctvMaze({ ...good, cameras: [{ ...camera, col: 5 }] }),
    ).toThrow(/camera at \(0, 5\) is out of bounds/);
    expect(() => verifyCctvMaze({ ...good, cameras: [camera, camera] })).toThrow(
      /two cameras stand at \(0, 1\)/,
    );
  });
});
