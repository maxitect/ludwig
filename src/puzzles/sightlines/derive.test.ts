import { describe, expect, it } from "vitest";
import { deriveBlindSpots, describeCell } from "./derive";
import type { Payload } from "./schema";

describe("deriveBlindSpots", () => {
  it("shades the cells behind a pillar and past an observer's cone (1x5 corridor)", () => {
    // . . # . .   observer at col 0 faces east and sees col 0, 1; the pillar at col 2
    // hides cols 3 and 4. A second observer at col 4 faces east, so it sees only its
    // own cell: col 3 is to its west, behind its back.
    const layout = {
      rows: 1,
      cols: 5,
      obstacles: [{ row: 0, col: 2 }],
      observers: [{ row: 0, col: 0, facing: "e" as const, fovDeg: 90 }],
    };
    expect(deriveBlindSpots(layout)).toEqual([
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);
    expect(
      deriveBlindSpots({
        ...layout,
        observers: [
          ...layout.observers,
          { row: 0, col: 4, facing: "e" as const, fovDeg: 90 },
        ],
      }),
    ).toEqual([{ row: 0, col: 3 }]);
  });

  it("includes the cone boundary and leaves the rest behind the observer blind (3x3 open floor)", () => {
    // An observer in the centre facing north with a 90 degree view sees the whole top
    // row (the corners lie exactly on the 45 degree edge) and its own cell.
    const layout = {
      rows: 3,
      cols: 3,
      obstacles: [],
      observers: [{ row: 1, col: 1, facing: "n" as const, fovDeg: 90 }],
    };
    expect(deriveBlindSpots(layout)).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]);
    expect(
      deriveBlindSpots({
        ...layout,
        observers: [{ row: 1, col: 1, facing: "n" as const, fovDeg: 360 }],
      }),
    ).toEqual([]);
  });

  it("never lists a pillar as a blind spot", () => {
    const blind = deriveBlindSpots({
      rows: 1,
      cols: 4,
      obstacles: [{ row: 0, col: 1 }],
      observers: [{ row: 0, col: 0, facing: "e", fovDeg: 90 }],
    });
    expect(blind).toEqual([
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]);
  });
});

describe("describeCell", () => {
  const payload: Payload = {
    rows: 3,
    cols: 3,
    targetRow: 2,
    targetCol: 2,
    obstacles: [{ row: 1, col: 1 }],
    observers: [{ row: 0, col: 0, facing: "ne", fovDeg: 90 }],
  };

  it("names what stands on a cell", () => {
    expect(describeCell(payload, 1, 1)).toBe("pillar");
    expect(describeCell(payload, 0, 0)).toBe("observer facing NE, 90 degree view");
    expect(describeCell(payload, 2, 2)).toBe("the alcove");
    expect(describeCell(payload, 0, 2)).toBe("floor");
  });
});
