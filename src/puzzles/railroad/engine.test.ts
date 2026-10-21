import { describe, expect, it } from "vitest";
import {
  countSolutions,
  endOnEdge,
  laidAlong,
  solve,
  trace,
} from "./engine";
import { loop, payload, track } from "./fixture";

const without = (pieces: typeof track, row: number, col: number) =>
  pieces.filter((piece) => piece.row !== row || piece.col !== col);

describe("trace", () => {
  it("follows a whole track from the entry to the exit", () => {
    const result = trace(payload, track);
    expect(result.reachesExit).toBe(true);
    expect(result.breakAt).toBeNull();
    expect(result.path).toHaveLength(7);
    expect(result.path[0]).toEqual({ row: 0, col: 0 });
    expect(result.path.at(-1)).toEqual({ row: 3, col: 3 });
    expect(result.strays).toEqual([]);
    expect(result.branches).toEqual([]);
  });

  it("reports the cell where the track stops short", () => {
    const result = trace(payload, without(track, 1, 2));
    expect(result.reachesExit).toBe(false);
    expect(result.breakAt).toEqual({ row: 0, col: 2 });
    expect(result.strays).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ]);
  });

  it("breaks where two pieces do not join", () => {
    const bent = track.map((piece) =>
      piece.row === 1 ? { ...piece, piece: "ew" as const } : piece,
    );
    const result = trace(payload, bent);
    expect(result.reachesExit).toBe(false);
    expect(result.breakAt).toEqual({ row: 0, col: 2 });
  });

  it("breaks when the entry has no piece or does not open onto the entry side", () => {
    expect(trace(payload, []).breakAt).toEqual({ row: 0, col: 0 });
    const wrongWay = track.map((piece) =>
      piece.row === 0 && piece.col === 0 ? { ...piece, piece: "ns" as const } : piece,
    );
    expect(trace(payload, wrongWay).reachesExit).toBe(false);
  });

  it("does not reach the exit by leaving the grid anywhere else", () => {
    const off = [{ row: 0, col: 0, piece: "nw" as const }];
    const result = trace(payload, off);
    expect(result.reachesExit).toBe(false);
    expect(result.breakAt).toEqual({ row: 0, col: 0 });
  });

  it("calls pieces off the path strays, and a separate ring is all strays", () => {
    const result = trace(payload, [...track, ...loop]);
    expect(result.reachesExit).toBe(true);
    expect(result.strays).toEqual([
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
    ]);
    expect(result.branches).toEqual([]);
  });

  it("reports a stray piece that opens onto the track as a branch", () => {
    const result = trace(payload, [
      ...track,
      { row: 1, col: 1, piece: "ew" },
    ]);
    expect(result.reachesExit).toBe(true);
    expect(result.strays).toEqual([{ row: 1, col: 1 }]);
    expect(result.branches).toEqual([{ row: 1, col: 2 }]);
  });
});

describe("countSolutions and solve", () => {
  it("finds the one track of a unique puzzle", () => {
    expect(countSolutions(payload, 5)).toBe(1);
    expect(solve(payload)).toEqual(track);
  });

  it("counts 2 when the clues allow two tracks, and stops at the limit", () => {
    const loose = {
      ...payload,
      rowCounts: [3, 3, 4, 3],
      colCounts: [4, 4, 3, 2],
      given: [],
    };
    expect(countSolutions(loose, 5)).toBe(2);
    expect(countSolutions(loose, 1)).toBe(1);
  });

  it("is made unique by a given piece the two tracks disagree on", () => {
    const loose = { ...payload, rowCounts: [3, 3, 4, 3], colCounts: [4, 4, 3, 2] };
    const given = (piece: "ns" | "nw") => [{ row: 1, col: 2, piece }];
    expect(countSolutions({ ...loose, given: given("ns") }, 5)).toBe(1);
    expect(countSolutions({ ...loose, given: given("nw") }, 5)).toBe(1);
    expect(countSolutions({ ...loose, given: [] }, 5)).toBe(2);
  });

  it("counts 0 for clues that no track meets", () => {
    const parity = { ...payload, rowCounts: [2, 2, 2, 2], colCounts: [2, 2, 2, 2], given: [] };
    expect(countSolutions(parity)).toBe(0);
    expect(solve(parity)).toBeNull();
    expect(countSolutions({ ...payload, rowCounts: [4, 1, 2, 1] })).toBe(0);
  });

  it("counts 0 when a given piece contradicts the counts", () => {
    expect(
      countSolutions({ ...payload, given: [{ row: 1, col: 2, piece: "ew" }] }),
    ).toBe(0);
  });
});

describe("laidAlong", () => {
  const ends = { entry: payload.entry, exit: payload.exit };

  it("joins the side a cell was entered from to the side it was left by", () => {
    const laid = laidAlong(ends, [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
    expect(laid.map(({ piece }) => piece)).toEqual(["ew", "sw", "ns"]);
  });

  it("turns an end that sits on the entry or the exit towards its light", () => {
    const fromEntry = laidAlong(ends, [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ]);
    expect(fromEntry[0].piece).toBe("sw");
    const toExit = laidAlong(ends, [
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ]);
    expect(toExit[1].piece).toBe("ne");
  });

  it("joins the first cell to the side it is told the track comes from", () => {
    const laid = laidAlong(
      ends,
      [
        { row: 1, col: 1 },
        { row: 2, col: 1 },
      ],
      "w",
    );
    expect(laid.map(({ piece }) => piece)).toEqual(["sw", "ns"]);
  });
});

describe("endOnEdge", () => {
  it("accepts an end only on the edge its side names", () => {
    expect(endOnEdge({ row: 0, col: 2, side: "n" }, 4, 4)).toBe(true);
    expect(endOnEdge({ row: 0, col: 2, side: "s" }, 4, 4)).toBe(false);
    expect(endOnEdge({ row: 3, col: 3, side: "e" }, 4, 4)).toBe(true);
    expect(endOnEdge({ row: 3, col: 2, side: "e" }, 4, 4)).toBe(false);
    expect(endOnEdge({ row: 4, col: 0, side: "w" }, 4, 4)).toBe(false);
  });
});
