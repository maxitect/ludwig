import { describe, expect, it } from "vitest";
import { shortestUnseenPaths } from "./engine";

const open = {
  rows: 3,
  cols: 3,
  walls: [],
  startRow: 0,
  startCol: 0,
  exitRow: 0,
  exitCol: 2,
};

describe("shortestUnseenPaths", () => {
  it("finds the one shortest path round a seen cell", () => {
    const result = shortestUnseenPaths(open, [{ row: 0, col: 1 }]);
    expect(result.count).toBe(1);
    expect(result.length).toBe(4);
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 0, col: 2 },
    ]);
  });

  it("counts two equal shortest paths as 2", () => {
    const result = shortestUnseenPaths({ ...open, exitRow: 1, exitCol: 1 }, []);
    expect(result.count).toBe(2);
    expect(result.length).toBe(2);
  });

  it("caps the count at 2 however many shortest paths there are", () => {
    const result = shortestUnseenPaths({ ...open, exitRow: 2, exitCol: 2 }, []);
    expect(result.length).toBe(4);
    expect(result.count).toBe(2);
  });

  it("uses a wall to make the shortest path unique", () => {
    const result = shortestUnseenPaths(
      {
        ...open,
        exitRow: 1,
        exitCol: 1,
        walls: [{ row: 1, col: 1, side: "north" }],
      },
      [],
    );
    expect(result.count).toBe(1);
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it("reports an unsolvable maze: the start is boxed in by seen cells", () => {
    const result = shortestUnseenPaths(open, [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]);
    expect(result).toEqual({ count: 0, length: null, path: null });
  });

  it("reports an unsolvable maze: walls seal the exit", () => {
    const result = shortestUnseenPaths(
      {
        ...open,
        walls: [
          { row: 0, col: 2, side: "west" },
          { row: 1, col: 2, side: "north" },
        ],
      },
      [],
    );
    expect(result.count).toBe(0);
  });

  it("reports no path when the start or the exit is seen", () => {
    expect(shortestUnseenPaths(open, [{ row: 0, col: 0 }]).count).toBe(0);
    expect(shortestUnseenPaths(open, [{ row: 0, col: 2 }]).count).toBe(0);
  });

  it("finds the direct path when nothing is seen", () => {
    const result = shortestUnseenPaths(open, []);
    expect(result.length).toBe(2);
    expect(result.count).toBe(1);
  });
});
