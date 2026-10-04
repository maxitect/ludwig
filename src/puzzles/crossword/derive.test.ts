import { describe, expect, it } from "vitest";
import { cellKey } from "../_shared/cell-grid/navigation";
import {
  deriveAnswer,
  deriveEnumeration,
  deriveEntries,
  deriveNumbers,
  deriveRuns,
  deriveWords,
} from "./derive";
import {
  cells,
  clues,
  crypticCells,
  crypticClues,
  toPayloadClues,
} from "./fixture";

const positions = cells.map(({ row, col }) => ({ row, col }));

describe("deriveRuns", () => {
  it("finds every white run of two or more cells in reading order", () => {
    expect(deriveRuns(positions)).toEqual([
      { direction: "across", row: 0, col: 0, length: 5 },
      { direction: "down", row: 0, col: 0, length: 5 },
      { direction: "down", row: 0, col: 2, length: 5 },
      { direction: "down", row: 0, col: 4, length: 5 },
      { direction: "across", row: 2, col: 0, length: 5 },
      { direction: "across", row: 4, col: 0, length: 5 },
    ]);
  });

  it("ignores single cells between blocks", () => {
    const runs = deriveRuns(positions);
    expect(runs.some((run) => run.row === 1 || run.row === 3)).toBe(false);
  });

  it("splits a line at a block", () => {
    const row = [0, 1, 3, 4].map((col) => ({ row: 0, col }));
    expect(deriveRuns(row)).toEqual([
      { direction: "across", row: 0, col: 0, length: 2 },
      { direction: "across", row: 0, col: 3, length: 2 },
    ]);
  });
});

describe("deriveNumbers", () => {
  it("numbers each start cell once, in reading order", () => {
    const numbers = deriveNumbers(deriveRuns(positions));
    expect([...numbers]).toEqual([
      [cellKey(0, 0), 1],
      [cellKey(0, 2), 2],
      [cellKey(0, 4), 3],
      [cellKey(2, 0), 4],
      [cellKey(4, 0), 5],
    ]);
  });
});

describe("deriveEnumeration", () => {
  const segments = (...parts: [number, "word" | "hyphen" | null][]) =>
    parts.map(([length, separator]) => ({ length, separator }));

  it("joins word breaks with commas", () => {
    expect(deriveEnumeration(segments([4, "word"], [3, null]))).toBe("(4,3)");
    expect(deriveEnumeration(segments([5, null]))).toBe("(5)");
  });

  it("joins a hyphen break with a hyphen", () => {
    expect(deriveEnumeration(segments([5, "hyphen"], [4, null]))).toBe("(5-4)");
  });

  it("mixes word and hyphen breaks", () => {
    expect(
      deriveEnumeration(segments([3, "word"], [4, "hyphen"], [5, null])),
    ).toBe("(3,4-5)");
  });

  it("reads a missing separator before the last segment as a word break", () => {
    expect(deriveEnumeration(segments([2, null], [2, null]))).toBe("(2,2)");
  });
});

describe("deriveEntries", () => {
  const entries = deriveEntries({ cells: positions, clues: toPayloadClues(clues) });

  it("pairs every run with its number, clue and enumeration", () => {
    expect(
      entries.map(({ number, direction, clueText, enumeration }) => [
        number,
        direction,
        clueText,
        enumeration,
      ]),
    ).toEqual([
      [1, "across", "A tall wading bird, or a lifting machine", "(5)"],
      [1, "down", "Grip tightly", "(5)"],
      [2, "down", "Unlikely sequence of letters", "(5)"],
      [3, "down", "Unlikely sequence, again", "(5)"],
      [4, "across", "Remains of a fire", "(5)"],
      [5, "across", "Ordinary, without frills", "(5)"],
    ]);
  });

  it("lists the cells of a run from its start", () => {
    const down = entries.find((e) => e.number === 2);
    expect(down?.cells).toEqual([0, 1, 2, 3, 4].map((row) => ({ row, col: 2 })));
  });

  it("leaves out a run that has no clue", () => {
    const fewer = deriveEntries({ cells: positions, clues: toPayloadClues(clues).slice(1) });
    expect(fewer).toHaveLength(5);
  });

  it("builds the Tab word map for one direction in number order", () => {
    expect(deriveWords(entries, "across").map((word) => word[0])).toEqual([
      { row: 0, col: 0 },
      { row: 2, col: 0 },
      { row: 4, col: 0 },
    ]);
    expect(deriveWords(entries, "down")).toHaveLength(3);
  });
});

describe("deriveAnswer", () => {
  it("reads the answer of a run from the solution cells", () => {
    const run = (direction: "across" | "down", row: number, col: number) => ({
      direction,
      row,
      col,
      length: 5,
    });
    expect(deriveAnswer(cells, run("across", 0, 0))).toBe("CRANE");
    expect(deriveAnswer(cells, run("across", 2, 0))).toBe("ASHES");
    expect(deriveAnswer(cells, run("across", 4, 0))).toBe("PLAIN");
    expect(deriveAnswer(cells, run("down", 0, 0))).toBe("CLASP");
    expect(deriveAnswer(cells, run("down", 0, 2))).toBe("ARHPA");
    expect(deriveAnswer(cells, run("down", 0, 4))).toBe("EVSEN");
  });
});

describe("a 15x15 cryptic grid", () => {
  const crypticPositions = crypticCells.map(({ row, col }) => ({ row, col }));
  const entries = deriveEntries({ cells: crypticPositions, clues: toPayloadClues(crypticClues) });

  it("numbers every start cell once, in reading order", () => {
    expect([...deriveNumbers(deriveRuns(crypticPositions))]).toEqual([
      [cellKey(0, 0), 1],
      [cellKey(0, 2), 2],
      [cellKey(0, 4), 3],
      [cellKey(0, 6), 4],
      [cellKey(0, 8), 5],
      [cellKey(0, 10), 6],
      [cellKey(0, 12), 7],
      [cellKey(0, 14), 8],
      [cellKey(2, 0), 9],
      [cellKey(2, 8), 10],
    ]);
  });

  it("derives the multi-segment enumeration from the segment lengths", () => {
    const first = entries.find((e) => e.number === 1 && e.direction === "across");
    expect(first?.enumeration).toBe("(4,3)");
    expect(first?.cells).toHaveLength(7);
    expect(entries.find((e) => e.number === 5 && e.direction === "across")?.enumeration).toBe(
      "(7)",
    );
  });

  it("derives the Tab word map for each direction", () => {
    expect(deriveWords(entries, "across").map((word) => word[0])).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 2, col: 0 },
      { row: 2, col: 8 },
    ]);
    expect(deriveWords(entries, "down")).toHaveLength(8);
  });
});
