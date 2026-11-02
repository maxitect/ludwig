import { describe, expect, it } from "vitest";
import {
  countSolutions,
  pairsOf,
  solutions,
  solve,
  trace,
  unmatchedPorts,
  type Layout,
} from "./engine";

const empty: Layout = {
  rows: 3,
  cols: 3,
  fixedMirrors: [],
  slots: [],
  ports: [],
};

const cells = (path: { row: number; col: number }[]) =>
  path.map(({ row, col }) => `${row},${col}`);

describe("trace", () => {
  it("passes straight through open floor", () => {
    const { path, exit } = trace(empty, [], { side: "w", offset: 0 });
    expect(cells(path)).toEqual(["0,0", "0,1", "0,2"]);
    expect(exit).toEqual({ side: "e", offset: 0 });
  });

  it("enters from every side heading inwards", () => {
    expect(trace(empty, [], { side: "n", offset: 2 }).exit).toEqual({
      side: "s",
      offset: 2,
    });
    expect(trace(empty, [], { side: "e", offset: 1 }).exit).toEqual({
      side: "w",
      offset: 1,
    });
    expect(trace(empty, [], { side: "s", offset: 0 }).exit).toEqual({
      side: "n",
      offset: 0,
    });
  });

  it("turns north off a slash and south off a backslash", () => {
    const slash: Layout = {
      ...empty,
      fixedMirrors: [{ row: 1, col: 1, mirror: "slash" }],
    };
    const north = trace(slash, [], { side: "w", offset: 1 });
    expect(cells(north.path)).toEqual(["1,0", "1,1", "0,1"]);
    expect(north.exit).toEqual({ side: "n", offset: 1 });

    const backslash: Layout = {
      ...empty,
      fixedMirrors: [{ row: 1, col: 1, mirror: "backslash" }],
    };
    const south = trace(backslash, [], { side: "w", offset: 1 });
    expect(cells(south.path)).toEqual(["1,0", "1,1", "2,1"]);
    expect(south.exit).toEqual({ side: "s", offset: 1 });
  });

  it("treats a mirror as two-sided", () => {
    const slash: Layout = {
      ...empty,
      fixedMirrors: [{ row: 1, col: 1, mirror: "slash" }],
    };
    expect(trace(slash, [], { side: "e", offset: 1 }).exit).toEqual({
      side: "s",
      offset: 1,
    });
    expect(trace(slash, [], { side: "n", offset: 1 }).exit).toEqual({
      side: "w",
      offset: 1,
    });
  });

  it("goes through a fixed mirror then a placed one and leaves by its own entry side", () => {
    const layout: Layout = {
      ...empty,
      fixedMirrors: [{ row: 0, col: 1, mirror: "backslash" }],
      slots: [{ row: 1, col: 1 }],
    };
    const { path, exit } = trace(
      layout,
      [{ row: 1, col: 1, mirror: "slash" }],
      { side: "w", offset: 0 },
    );
    expect(cells(path)).toEqual(["0,0", "0,1", "1,1", "1,0"]);
    expect(path.map(({ heading }) => heading)).toEqual(["e", "e", "s", "w"]);
    expect(exit).toEqual({ side: "w", offset: 1 });
  });

  it("treats an empty slot as open floor", () => {
    const layout: Layout = { ...empty, slots: [{ row: 0, col: 1 }] };
    expect(trace(layout, [], { side: "w", offset: 0 }).exit).toEqual({
      side: "e",
      offset: 0,
    });
  });
});

const joinCentre = (extra: Partial<Layout> = {}): Layout => ({
  ...empty,
  slots: [{ row: 1, col: 1 }],
  ports: [
    { side: "w", offset: 1, label: "A" },
    { side: "n", offset: 1, label: "A" },
  ],
  ...extra,
});

describe("pairsOf and unmatchedPorts", () => {
  it("pairs ports by letter in letter order", () => {
    const layout: Layout = {
      ...empty,
      ports: [
        { side: "e", offset: 0, label: "B" },
        { side: "w", offset: 1, label: "A" },
        { side: "n", offset: 1, label: "A" },
        { side: "s", offset: 0, label: "B" },
      ],
    };
    expect(pairsOf(layout).map(({ label }) => label)).toEqual(["A", "B"]);
  });

  it("reports both ports of a pair that is not joined", () => {
    const layout = joinCentre();
    expect(unmatchedPorts(layout, [])).toHaveLength(2);
    expect(
      unmatchedPorts(layout, [{ row: 1, col: 1, mirror: "backslash" }]),
    ).toHaveLength(2);
    expect(
      unmatchedPorts(layout, [{ row: 1, col: 1, mirror: "slash" }]),
    ).toEqual([]);
  });
});

describe("countSolutions", () => {
  it("finds the one mirror that joins the pair", () => {
    const layout = joinCentre();
    expect(countSolutions(layout)).toBe(1);
    expect(solve(layout)).toEqual([{ row: 1, col: 1, mirror: "slash" }]);
  });

  it("counts two when a slot is unconstrained", () => {
    const layout = joinCentre({
      slots: [
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ],
    });
    expect(countSolutions(layout)).toBe(2);
    expect(solutions(layout).map((answer) => answer[1].mirror).sort()).toEqual([
      "backslash",
      "slash",
    ]);
  });

  it("stops counting at the cap", () => {
    const layout = joinCentre({
      slots: [
        { row: 1, col: 1 },
        { row: 2, col: 0 },
        { row: 2, col: 2 },
      ],
    });
    expect(countSolutions(layout, 3)).toBe(3);
    expect(countSolutions(layout, 2)).toBe(2);
    expect(solutions(layout)).toHaveLength(4);
  });

  it("counts none when the pair cannot be joined", () => {
    const layout = joinCentre({
      ports: [
        { side: "w", offset: 1, label: "A" },
        { side: "e", offset: 1, label: "A" },
      ],
    });
    expect(countSolutions(layout)).toBe(0);
    expect(solve(layout)).toBeNull();
  });

  it("is satisfied by a pair that no slot affects", () => {
    const layout: Layout = {
      ...empty,
      ports: [
        { side: "w", offset: 0, label: "A" },
        { side: "e", offset: 0, label: "A" },
      ],
    };
    expect(countSolutions(layout)).toBe(1);
    expect(solve(layout)).toEqual([]);
  });
});
