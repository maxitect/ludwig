import { describe, expect, it } from "vitest";
import {
  inCone,
  lineOfSight,
  segmentHitsDisc,
  visibleCells,
} from "./visibility";

type Cell = { row: number; col: number };

function gridOf(rows: number, cols: number, obstacles: Cell[] = []) {
  const keys = new Set(obstacles.map((c) => `${c.row},${c.col}`));
  return {
    rows,
    cols,
    isBlocked: (row: number, col: number) => keys.has(`${row},${col}`),
  };
}

function render(
  rows: number,
  cols: number,
  obstacles: Cell[],
  observer: Cell,
  visible: Cell[],
) {
  const seen = new Set(visible.map((c) => `${c.row},${c.col}`));
  const blocked = new Set(obstacles.map((c) => `${c.row},${c.col}`));
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const key = `${row},${col}`;
      if (row === observer.row && col === observer.col) return "@";
      if (blocked.has(key)) return "#";
      return seen.has(key) ? "o" : ".";
    }).join(""),
  );
}

describe("lineOfSight", () => {
  const cases: {
    name: string;
    obstacles: Cell[];
    from: Cell;
    to: Cell;
    expected: boolean;
  }[] = [
    {
      name: "open horizontal ray",
      obstacles: [],
      from: { row: 3, col: 0 },
      to: { row: 3, col: 6 },
      expected: true,
    },
    {
      name: "open knight-shaped ray",
      obstacles: [{ row: 0, col: 6 }],
      from: { row: 0, col: 0 },
      to: { row: 2, col: 5 },
      expected: true,
    },
    {
      name: "ray blocked by a single obstacle",
      obstacles: [{ row: 3, col: 3 }],
      from: { row: 3, col: 0 },
      to: { row: 3, col: 6 },
      expected: false,
    },
    {
      name: "diagonal ray blocked by a single obstacle",
      obstacles: [{ row: 2, col: 2 }],
      from: { row: 0, col: 0 },
      to: { row: 4, col: 4 },
      expected: false,
    },
    {
      name: "adjacent diagonal squeezing between two obstacles is blocked",
      obstacles: [
        { row: 3, col: 4 },
        { row: 4, col: 3 },
      ],
      from: { row: 3, col: 3 },
      to: { row: 4, col: 4 },
      expected: false,
    },
    {
      name: "adjacent diagonal with one corner obstacle is open",
      obstacles: [{ row: 3, col: 4 }],
      from: { row: 3, col: 3 },
      to: { row: 4, col: 4 },
      expected: true,
    },
    {
      name: "long diagonal squeezing between two obstacles is blocked",
      obstacles: [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ],
      from: { row: 0, col: 0 },
      to: { row: 3, col: 3 },
      expected: false,
    },
    {
      name: "shallow ray through a corner with one obstacle is open",
      obstacles: [{ row: 1, col: 1 }],
      from: { row: 0, col: 0 },
      to: { row: 1, col: 3 },
      expected: true,
    },
    {
      name: "shallow ray through a corner with both obstacles is blocked",
      obstacles: [
        { row: 0, col: 2 },
        { row: 1, col: 1 },
      ],
      from: { row: 0, col: 0 },
      to: { row: 1, col: 3 },
      expected: false,
    },
    {
      name: "adjacent orthogonal cell",
      obstacles: [{ row: 2, col: 2 }],
      from: { row: 3, col: 3 },
      to: { row: 3, col: 4 },
      expected: true,
    },
    {
      name: "same cell",
      obstacles: [{ row: 1, col: 1 }],
      from: { row: 1, col: 1 },
      to: { row: 1, col: 1 },
      expected: true,
    },
    {
      name: "blocked target cell does not block its own ray",
      obstacles: [{ row: 3, col: 6 }],
      from: { row: 3, col: 0 },
      to: { row: 3, col: 6 },
      expected: true,
    },
    {
      name: "symmetric when reversed",
      obstacles: [{ row: 3, col: 3 }],
      from: { row: 3, col: 6 },
      to: { row: 3, col: 0 },
      expected: false,
    },
  ];

  it.each(cases)("$name", ({ obstacles, from, to, expected }) => {
    expect(lineOfSight(gridOf(7, 7, obstacles), from, to)).toBe(expected);
  });
});

describe("inCone", () => {
  const directions = [
    { facing: "n", row: -1, col: 0 },
    { facing: "ne", row: -1, col: 1 },
    { facing: "e", row: 0, col: 1 },
    { facing: "se", row: 1, col: 1 },
    { facing: "s", row: 1, col: 0 },
    { facing: "sw", row: 1, col: -1 },
    { facing: "w", row: 0, col: -1 },
    { facing: "nw", row: -1, col: -1 },
  ] as const;

  const origin = { row: 10, col: 10 };

  const table = directions.flatMap((facing, index) =>
    directions.flatMap((target, targetIndex) => {
      const steps = Math.min(
        Math.abs(index - targetIndex),
        8 - Math.abs(index - targetIndex),
      );
      return [90, 45].map((fov_deg) => ({
        facing: facing.facing,
        target: target.facing,
        fov_deg,
        expected: steps * 45 <= fov_deg / 2,
        cell: {
          row: origin.row + target.row * 3,
          col: origin.col + target.col * 3,
        },
      }));
    }),
  );

  it.each(table)(
    "facing $facing, target $target, fov $fov_deg -> $expected",
    ({ facing, fov_deg, cell, expected }) => {
      expect(inCone({ ...origin, facing, fov_deg }, cell)).toBe(expected);
    },
  );

  it("includes the exact boundary angle at fov 90", () => {
    expect(
      inCone({ ...origin, facing: "n", fov_deg: 90 }, { row: 7, col: 13 }),
    ).toBe(true);
  });

  it("excludes just past the boundary and includes just inside at fov 45", () => {
    const observer = { ...origin, facing: "n" as const, fov_deg: 45 };
    expect(inCone(observer, { row: 8, col: 11 })).toBe(false);
    expect(inCone(observer, { row: 5, col: 12 })).toBe(true);
  });

  it("applies range_cells inclusively with Euclidean distance", () => {
    const observer = {
      ...origin,
      facing: "n" as const,
      fov_deg: 90,
      range_cells: 2,
    };
    expect(inCone(observer, { row: 8, col: 10 })).toBe(true);
    expect(inCone(observer, { row: 7, col: 10 })).toBe(false);
    expect(inCone(observer, { row: 9, col: 11 })).toBe(true);
    expect(inCone(observer, { row: 8, col: 12 })).toBe(false);
  });

  it("treats a null range_cells as unlimited", () => {
    const observer = {
      ...origin,
      facing: "n" as const,
      fov_deg: 90,
      range_cells: null,
    };
    expect(inCone(observer, { row: 0, col: 10 })).toBe(true);
  });

  it("includes the observer's own cell", () => {
    expect(inCone({ ...origin, facing: "n", fov_deg: 45 }, origin)).toBe(true);
  });
});

describe("visibleCells", () => {
  it("clips a 90 degree east cone and shades behind an obstacle", () => {
    const obstacles = [{ row: 3, col: 5 }];
    const observer = { row: 3, col: 3, facing: "e" as const, fov_deg: 90 };
    const grid = gridOf(7, 7, obstacles);

    expect(
      render(7, 7, obstacles, observer, visibleCells(grid, observer)),
    ).toEqual([
      "......o",
      ".....oo",
      "....ooo",
      "...@o#.",
      "....ooo",
      ".....oo",
      "......o",
    ]);
  });

  it("limits a full-circle view by range and corner squeezes", () => {
    const obstacles = [
      { row: 1, col: 3 },
      { row: 3, col: 4 },
    ];
    const observer = {
      row: 3,
      col: 3,
      facing: "n" as const,
      fov_deg: 360,
      range_cells: 2,
    };
    const grid = gridOf(7, 7, obstacles);

    expect(
      render(7, 7, obstacles, observer, visibleCells(grid, observer)),
    ).toEqual([
      ".......",
      "...#...",
      "..ooo..",
      ".oo@#..",
      "..ooo..",
      "...o...",
      ".......",
    ]);
  });
});

describe("segmentHitsDisc", () => {
  const centre = { x: 0, y: 0 };

  it("counts a tangent as a hit", () => {
    expect(segmentHitsDisc({ x: -2, y: 1 }, { x: 2, y: 1 }, centre, 1)).toBe(
      true,
    );
  });

  it("misses a parallel segment beyond the radius", () => {
    expect(segmentHitsDisc({ x: -2, y: 2 }, { x: 2, y: 2 }, centre, 1)).toBe(
      false,
    );
  });

  it("hits a segment crossing the disc", () => {
    expect(
      segmentHitsDisc({ x: -2, y: 0.5 }, { x: 2, y: 0.5 }, centre, 1),
    ).toBe(true);
  });

  it("hits when an endpoint is inside the disc", () => {
    expect(segmentHitsDisc({ x: 0.5, y: 0 }, { x: 5, y: 0 }, centre, 1)).toBe(
      true,
    );
  });

  it("misses a segment that stops short of the disc", () => {
    expect(segmentHitsDisc({ x: -5, y: 0 }, { x: -2, y: 0 }, centre, 1)).toBe(
      false,
    );
  });

  it("handles a degenerate segment", () => {
    expect(segmentHitsDisc({ x: 3, y: 0 }, { x: 3, y: 0 }, centre, 1)).toBe(
      false,
    );
    expect(segmentHitsDisc({ x: 0.5, y: 0 }, { x: 0.5, y: 0 }, centre, 1)).toBe(
      true,
    );
  });
});

describe("performance and determinism", () => {
  const obstacles = Array.from({ length: 900 }, (_, i) => ({
    row: Math.floor(i / 30),
    col: i % 30,
  })).filter((c) => (c.row * 7 + c.col * 13) % 11 === 0);
  const grid = gridOf(30, 30, obstacles);
  const observers = Array.from({ length: 20 }, (_, i) => ({
    row: (i * 7 + 1) % 30,
    col: (i * 11 + 2) % 30,
    facing: "n" as const,
    fov_deg: 360,
  })).filter((o) => !grid.isBlocked(o.row, o.col));

  it("runs 20 observers on a 30x30 grid under 50ms", () => {
    const start = performance.now();
    for (const observer of observers) visibleCells(grid, observer);
    expect(performance.now() - start).toBeLessThan(50);
  });

  it("returns identical results on repeat calls", () => {
    const first = visibleCells(grid, observers[0]);
    expect(visibleCells(grid, observers[0])).toEqual(first);
  });
});
