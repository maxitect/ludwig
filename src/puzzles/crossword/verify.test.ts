import { describe, expect, it } from "vitest";
import { cells, clues, fixture } from "./fixture";
import type { Content } from "./schema";
import { deriveRuns } from "./derive";
import { gridStandardProblems, verifyCrossword } from "./verify";

const QUICK_ROWS = [
  "REPEAT#CHAPEL",
  "I#H#C#S#O#H#A",
  "NEIGHBOURHOOD",
  "G#L#E#U#R#T#D",
  "EGOS#ANTIDOTE",
  "D#S#E#D#F#G#R",
  "#FORCE#LITRE#",
  "D#P#O#B#C#A#U",
  "ENHANCED#SPIN",
  "L#I#O#G#L#H#I",
  "ACCOMPANIMENT",
  "Y#A#I#N#M#R#E",
  "SELECT#ABUSED",
];

const MINI_ROWS = [
  "HELMET#C#T#",
  "#Q#EVERYDAY",
  "MURDER#N#K#",
  "#I#INSPIRES",
  "UPDATE#CANT",
  "N#I#S#C#G#I",
  "DAMP#CAREER",
  "OVERCOME#A#",
  "#E#I#DEBUGS",
  "PREMIERE#L#",
  "#T#E#SALTER",
];

const gridOf = (style: Content["style"], rows: string[]): Content => {
  const cells = rows.flatMap((line, row) =>
    [...line].flatMap((letter, col) =>
      letter === "#" ? [] : [{ row, col, letter }],
    ),
  );
  return {
    style,
    rows: rows.length,
    cols: rows[0].length,
    cells,
    clues: deriveRuns(cells).map(({ direction, row, col, length }) => ({
      direction,
      row,
      col,
      clueText: "A clue",
      segments: [length],
    })),
  };
};

const problems = (style: Content["style"], rows: string[]) =>
  gridStandardProblems(gridOf(style, rows)).join("; ");

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

  describe("grid standards", () => {
    it("accepts a conforming 13x13 quick grid and 11x11 mini grid", () => {
      expect(() => verifyCrossword(gridOf("quick", QUICK_ROWS))).not.toThrow();
      expect(() => verifyCrossword(gridOf("mini", MINI_ROWS))).not.toThrow();
    });

    it("rejects an asymmetric grid", () => {
      const rows = QUICK_ROWS.map((line, i) =>
        i === 0 ? `#${line.slice(1)}` : line,
      );
      expect(problems("quick", rows)).toMatch(/not rotationally symmetric/);
    });

    it("rejects a two-letter entry", () => {
      expect(problems("mini", ["ABC", "DEF"])).toMatch(
        /down run at row 1, column 1 is only 2 letters/,
      );
    });

    it("rejects a fully checked quick entry and a ratio out of range", () => {
      const found = problems("quick", ["ABC", "DEF", "GHI"]);
      expect(found).toMatch(/across run at row 1, column 1 is fully checked/);
      expect(found).toMatch(/100% of letters are checked, quick grids need 30% to 60%/);
    });

    it("rejects a quick entry with no checked letter", () => {
      expect(problems("quick", ["ABC"])).toMatch(
        /across run at row 1, column 1 has no checked letter/,
      );
    });

    it("rejects a grid with too many blocks", () => {
      expect(problems("quick", ["ABC", "###", "###", "DEF"])).toMatch(
        /50% of the grid is black, at most 40%/,
      );
    });

    it("rejects a mini under 60% checked", () => {
      expect(problems("mini", ["ABCDE", "F###G", "HIJKL"])).toMatch(
        /33% of letters are checked, a mini needs at least 60%/,
      );
    });

    it("rejects a mini with too many entries", () => {
      const rows = Array.from({ length: 17 }, (_, i) =>
        Array.from({ length: 17 }, (_, j) =>
          String.fromCharCode(65 + ((i * 3 + j * 5) % 26)),
        ).join(""),
      );
      expect(problems("mini", rows)).toMatch(/34 entries, a mini has at most 32/);
    });

    it("rejects a repeated entry", () => {
      expect(problems("mini", ["CATS", "####", "CATS"])).toMatch(
        /CATS appears twice/,
      );
    });

    it("rejects a repeated root", () => {
      expect(problems("mini", ["PLAYER", "######", "PLAYED"])).toMatch(
        /PLAYER and PLAYED share a root/,
      );
    });
  });
});
