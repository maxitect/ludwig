import { describe, expect, it } from "vitest";
import { check } from "./check";
import { loop, payload, straightTop, track, withLoop } from "./fixture";

const solution = track;

describe("railroad check", () => {
  it("accepts the track", () => {
    expect(check(payload, solution, { pieces: track })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects a layout that matches every count but holds a separate loop, and names the loop", () => {
    const result = check(withLoop, solution, {
      pieces: [...straightTop, ...loop],
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual([
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
    ]);
  });

  it("rejects the straight run alone, because the counts are not met", () => {
    expect(check(withLoop, solution, { pieces: straightTop }).correct).toBe(false);
  });

  it("names the cell where the track stops short", () => {
    const result = check(payload, solution, {
      pieces: track.filter((piece) => piece.row !== 2 || piece.col !== 3),
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toContainEqual({ row: 2, col: 2 });
  });

  it("rejects a changed or missing given piece and names it", () => {
    const changed = check(payload, solution, {
      pieces: track.map((piece) =>
        piece.row === 1 ? { ...piece, piece: "ew" as const } : piece,
      ),
    });
    expect(changed.correct).toBe(false);
    expect(changed.wrongParts).toContainEqual({ row: 1, col: 2 });
    const missing = check(payload, solution, {
      pieces: track.filter((piece) => piece.row !== 1),
    });
    expect(missing.correct).toBe(false);
    expect(missing.wrongParts).toContainEqual({ row: 1, col: 2 });
  });

  it("rejects a track that reaches the exit with a count over, and names the piece in the line", () => {
    const result = check(payload, solution, {
      pieces: [...track, { row: 1, col: 3, piece: "ns" }],
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toContainEqual({ row: 1, col: 3 });
  });

  it("ignores pieces outside the grid", () => {
    const result = check(payload, solution, {
      pieces: [...track, { row: 9, col: 9, piece: "ns" }],
    });
    expect(result.correct).toBe(true);
  });
});
