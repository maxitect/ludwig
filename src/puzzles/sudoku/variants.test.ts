import { describe, expect, it } from "vitest";
import { content as cageMatch } from "../../../content/sudoku/cage-match";
import { content as deadSum } from "../../../content/sudoku/dead-sum";
import { content as romanNumerals } from "../../../content/sudoku/roman-numerals";
import { content as safeHouse } from "../../../content/sudoku/safe-house";
import { content as xMarks } from "../../../content/sudoku/x-marks-the-spot";
import { check } from "./check";
import {
  classicUnits,
  conflictingIndexes,
  countSolutions,
  gridFromGivens,
  solve,
  unitsFor,
  variantFor,
} from "./engine";
import {
  contentSchema,
  payloadSchema,
  type Content,
  type Payload,
} from "./schema";
import { verifySudoku } from "./verify";

const killers = [
  ["cage-match", cageMatch],
  ["dead-sum", deadSum],
  ["safe-house", safeHouse],
] as const;
const xvs = [
  ["x-marks-the-spot", xMarks],
  ["roman-numerals", romanNumerals],
] as const;

const countOf = ({ givens, regions, cages, xv }: Content, limit = 2) =>
  countSolutions(givens, limit, unitsFor(regions), variantFor({ cages, xv }));

const solved = (content: Content) =>
  solve(
    content.givens,
    unitsFor(content.regions),
    variantFor(content),
  )!;

describe.each(killers)("killer sudoku %s", (_slug, content) => {
  const payload = payloadSchema.parse(content);

  it("is a valid content file with exactly one completion", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
    expect(() => verifySudoku(content)).not.toThrow();
    expect(countOf(content)).toBe(1);
  });

  it("has more than one completion once its cages are loosened", () => {
    const loosened = { ...content, cages: content.cages.slice(0, 8) };
    expect(countOf(loosened)).toBe(2);
    expect(() => verifySudoku(loosened)).toThrow(/more than one/);
  });

  it("has no completion when a cage asks for a sum its cells cannot make", () => {
    const [first, ...rest] = content.cages;
    const contradictory = {
      ...content,
      cages: [{ ...first, sum: first.sum === 45 ? 44 : first.sum + 1 }, ...rest],
    };
    expect(countOf(contradictory)).toBe(0);
    expect(() => verifySudoku(contradictory)).toThrow(/no solution/);
  });

  it("accepts its own solution and flags a whole cage that misses its sum", () => {
    const grid = solved(content);
    expect(check(payload, grid, { cells: grid })).toEqual({
      correct: true,
      wrongParts: [],
    });
    const [cage] = content.cages.filter(({ cells }) => cells.length > 1);
    const [first] = cage.cells;
    const off = grid.map((cell) =>
      cell.row === first.row && cell.col === first.col
        ? { ...cell, digit: (cell.digit % 9) + 1 }
        : cell,
    );
    const result = check(payload, grid, { cells: off });
    expect(result.correct).toBe(false);
    for (const cell of cage.cells) {
      expect(result.wrongParts).toContainEqual({ row: cell.row, col: cell.col });
    }
  });
});

describe.each(xvs)("XV sudoku %s", (_slug, content) => {
  const payload = payloadSchema.parse(content);

  it("is a valid content file with exactly one completion", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
    expect(() => verifySudoku(content)).not.toThrow();
    expect(countOf(content)).toBe(1);
  });

  it("has more than one completion once its givens are removed", () => {
    const loosened = { ...content, givens: [] };
    expect(countOf(loosened)).toBe(2);
    expect(() => verifySudoku(loosened)).toThrow(/more than one/);
  });

  it("has no completion when a given contradicts a mark", () => {
    const grid = solved(content);
    const [mark] = content.xv.marks;
    const at = (row: number, col: number) => grid[row * 9 + col].digit;
    const next =
      mark.direction === "right"
        ? { row: mark.row, col: mark.col + 1 }
        : { row: mark.row + 1, col: mark.col };
    const wrongPartner = (at(next.row, next.col) % 9) + 1;
    const contradictory = {
      ...content,
      givens: [
        { row: mark.row, col: mark.col, digit: at(mark.row, mark.col) },
        { ...next, digit: wrongPartner },
      ],
    };
    expect(countOf(contradictory)).toBe(0);
    expect(() => verifySudoku(contradictory)).toThrow(/no solution/);
  });

  it("applies the negative rule: a grid valid except for one unmarked pair that adds up to 10 is rejected, naming both cells", () => {
    const grid = solved(content);
    expect(check(payload, grid, { cells: grid }).correct).toBe(true);
    const index = content.xv.marks.findIndex(({ mark }) => mark === "x");
    const mark = content.xv.marks[index];
    const without: Payload = {
      ...payload,
      xv: { marks: content.xv.marks.filter((_, at) => at !== index) },
    };
    const partner =
      mark.direction === "right"
        ? { row: mark.row, col: mark.col + 1 }
        : { row: mark.row + 1, col: mark.col };
    const result = check(without, grid, { cells: grid });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual(
      [{ row: mark.row, col: mark.col }, partner].sort(
        (a, b) => a.row * 9 + a.col - (b.row * 9 + b.col),
      ),
    );
  });

  it("flags both cells of a marked pair that misses its sum", () => {
    const grid = solved(content);
    const mark = content.xv.marks.find(({ mark: kind }) => kind === "v")!;
    const partner =
      mark.direction === "right"
        ? { row: mark.row, col: mark.col + 1 }
        : { row: mark.row + 1, col: mark.col };
    const off = grid.map((cell) =>
      cell.row === partner.row && cell.col === partner.col
        ? { ...cell, digit: (cell.digit % 9) + 1 }
        : cell,
    );
    const { wrongParts } = check(payload, grid, { cells: off });
    expect(wrongParts).toContainEqual({ row: mark.row, col: mark.col });
    expect(wrongParts).toContainEqual(partner);
  });
});

describe("variantFor and the engine", () => {
  it("has no variant for a classic puzzle and applies the negative rule only with an XV set", () => {
    expect(variantFor({})).toBeUndefined();
    expect(variantFor({ cages: [] })).toBeUndefined();
    const grid = gridFromGivens([
      { row: 0, col: 0, digit: 2 },
      { row: 0, col: 1, digit: 3 },
    ]);
    expect(conflictingIndexes(grid, classicUnits).size).toBe(0);
    expect(
      conflictingIndexes(grid, classicUnits, variantFor({ xv: { marks: [] } })),
    ).toEqual(new Set([0, 1]));
    expect(
      conflictingIndexes(
        grid,
        classicUnits,
        variantFor({
          xv: { marks: [{ row: 0, col: 0, direction: "right", mark: "v" }] },
        }),
      ).size,
    ).toBe(0);
  });

  it("flags a cage that repeats a digit or passes its sum while it is still open", () => {
    const cages = [
      {
        sum: 10,
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
          { row: 2, col: 2 },
        ],
      },
    ];
    const variant = variantFor({ cages });
    const flagged = (digits: [number, number, number]) =>
      conflictingIndexes(
        gridFromGivens([
          { row: 0, col: 0, digit: digits[0] },
          { row: 1, col: 1, digit: digits[1] },
          { row: 2, col: 2, digit: digits[2] },
        ].filter(({ digit }) => digit)),
        classicUnits,
        variant,
      ).size;
    expect(flagged([5, 6, 0])).toBe(2);
    expect(flagged([3, 3, 0])).toBe(2);
    expect(flagged([2, 3, 6])).toBe(3);
    expect(flagged([1, 2, 0])).toBe(0);
    expect(flagged([1, 2, 7])).toBe(0);
    expect(flagged([2, 3, 4])).toBe(3);
  });

  it("verifies cages and marks are well formed", () => {
    const base = { givens: cageMatch.givens };
    const cell = (row: number, col: number) => ({ row, col });
    expect(() =>
      verifySudoku({
        ...base,
        cages: [
          { sum: 10, cells: [cell(0, 0), cell(2, 2)] },
        ],
      }),
    ).toThrow(/not edge-connected/);
    expect(() =>
      verifySudoku({
        ...base,
        cages: [
          { sum: 10, cells: [cell(0, 0), cell(0, 1)] },
          { sum: 10, cells: [cell(0, 1), cell(0, 2)] },
        ],
      }),
    ).toThrow(/in two cages/);
    expect(() =>
      verifySudoku({
        ...base,
        cages: [{ sum: 20, cells: [cell(0, 0), cell(0, 1)] }],
      }),
    ).toThrow(/cannot make 20 from 2 distinct digits/);
    expect(() =>
      verifySudoku({
        ...base,
        cages: [{ sum: 2, cells: [cell(0, 0), cell(0, 1)] }],
      }),
    ).toThrow(/cannot make 2 from 2 distinct digits/);
    expect(() =>
      verifySudoku({
        ...base,
        xv: { marks: [{ row: 0, col: 8, direction: "right", mark: "x" }] },
      }),
    ).toThrow(/leaves the grid/);
    expect(() =>
      verifySudoku({
        ...base,
        xv: { marks: [{ row: 8, col: 0, direction: "down", mark: "v" }] },
      }),
    ).toThrow(/leaves the grid/);
    expect(() =>
      verifySudoku({
        ...base,
        xv: {
          marks: [
            { row: 0, col: 0, direction: "right", mark: "v" },
            { row: 0, col: 0, direction: "right", mark: "x" },
          ],
        },
      }),
    ).toThrow(/duplicate right mark/);
  });

  it("rejects a cage sum outside 1 to 45, an empty cage and an unknown mark in the schema", () => {
    const cage = { sum: 3, cells: [{ row: 0, col: 0 }] };
    const parse = (cages: unknown, xv?: unknown) =>
      contentSchema.safeParse({ givens: [], cages, xv }).success;
    expect(parse([cage])).toBe(true);
    expect(parse([{ ...cage, sum: 0 }])).toBe(false);
    expect(parse([{ ...cage, sum: 46 }])).toBe(false);
    expect(parse([{ ...cage, cells: [] }])).toBe(false);
    expect(
      parse([], { marks: [{ row: 0, col: 0, direction: "right", mark: "z" }] }),
    ).toBe(false);
  });

  it("keeps the payload free of any solution field", () => {
    for (const content of [cageMatch, romanNumerals]) {
      const payload = payloadSchema.parse(content);
      expect(payloadSchema.strict().parse(payload)).toEqual(payload);
      expect(
        payloadSchema
          .strict()
          .safeParse({ ...payload, solution: solved(content) }).success,
      ).toBe(false);
    }
  });
});
