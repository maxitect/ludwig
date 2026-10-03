import { describe, expect, it } from "vitest";
import { cells, clues, fixture } from "./fixture";
import type { Content } from "./schema";
import { verifyCrossword } from "./verify";

const verify = (overrides: Partial<Content>) =>
  verifyCrossword({ ...fixture, ...overrides });

describe("verifyCrossword", () => {
  it("accepts the fixture", () => {
    expect(() => verifyCrossword(fixture)).not.toThrow();
  });

  it("names a run with no clue", () => {
    expect(() => verify({ clues: clues.slice(1) })).toThrow(
      /across run at row 1, column 1 has 0 clues/,
    );
  });

  it("names a run with two clues", () => {
    expect(() => verify({ clues: [...clues, clues[0]] })).toThrow(
      /across run at row 1, column 1 has 2 clues/,
    );
  });

  it("rejects a clue that starts no run", () => {
    expect(() =>
      verify({
        clues: [...clues, { ...clues[0], direction: "down", row: 0, col: 1 }],
      }),
    ).toThrow(/clue at down run at row 1, column 2 does not start a run/);
  });

  it("rejects segments that do not add up to the run", () => {
    expect(() =>
      verify({
        clues: clues.map((c, i) => (i === 4 ? { ...c, segments: [2, 2] } : c)),
      }),
    ).toThrow(/across run at row 3, column 1: segments add up to 4, the run is 5/);
  });

  it("rejects a clue that contains its answer", () => {
    expect(() =>
      verify({
        clues: clues.map((c, i) =>
          i === 0 ? { ...c, clueText: "Not a crane, a heron" } : c,
        ),
      }),
    ).toThrow(/the clue contains its answer CRANE/);
  });

  it("rejects a grid that is not connected", () => {
    const split = cells.filter(
      ({ row, col }) => !(row === 2 || (row === 1 && col === 2) || (row === 3 && col === 2)),
    );
    expect(() => verify({ cells: split, clues: [] })).toThrow(
      /the grid is not connected/,
    );
  });

  it("rejects a cell outside the grid and a duplicate cell", () => {
    expect(() =>
      verify({ cells: [...cells, { row: 5, col: 0, letter: "A" }] }),
    ).toThrow(/outside the grid/);
    expect(() => verify({ cells: [...cells, cells[0]] })).toThrow(
      /duplicate cell/,
    );
  });
});
