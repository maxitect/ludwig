import { describe, expect, it } from "vitest";
import { content as branchLine } from "../../../content/railroad/branch-line";
import { content as lastStop } from "../../../content/railroad/last-stop";
import { content as nightTrain } from "../../../content/railroad/night-train";
import { content as signalBox } from "../../../content/railroad/signal-box";
import { content as terminus } from "../../../content/railroad/terminus";
import { contentSchema, type Content } from "./schema";
import { verifyRailroad } from "./verify";

const grid: Omit<Content, "rowCounts" | "colCounts"> = {
  rows: 4,
  cols: 4,
  entry: { row: 0, col: 0, side: "w" },
  exit: { row: 3, col: 3, side: "e" },
  given: [],
};

describe("verifyRailroad", () => {
  it("accepts the five puzzles, each with exactly one track", () => {
    for (const content of [nightTrain, branchLine, lastStop, signalBox, terminus]) {
      expect(contentSchema.parse(content)).toEqual(content);
      expect(() => verifyRailroad(content)).not.toThrow();
    }
  });

  it("rejects clues with two tracks, and clues with none", () => {
    expect(() =>
      verifyRailroad({ ...grid, rowCounts: [3, 3, 4, 3], colCounts: [4, 4, 3, 2] }),
    ).toThrow(/more than one solution/);
    expect(() =>
      verifyRailroad({ ...grid, rowCounts: [2, 2, 2, 2], colCounts: [2, 2, 2, 2] }),
    ).toThrow(/no solution/);
  });

  it("rejects counts that disagree about the number of track cells", () => {
    expect(() =>
      verifyRailroad({ ...nightTrain, rowCounts: nightTrain.rowCounts.map((n) => n + 1) }),
    ).toThrow(/add up differently/);
  });
});

describe("contentSchema", () => {
  it("rejects an end that is not on the edge its side names", () => {
    const result = contentSchema.safeParse({
      ...nightTrain,
      entry: { row: 2, col: 2, side: "n" },
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/not on the n edge/);
  });

  it("rejects a diagonal side, a 12-row grid and counts that do not match the size", () => {
    expect(
      contentSchema.safeParse({ ...nightTrain, exit: { row: 0, col: 0, side: "ne" } }).success,
    ).toBe(false);
    expect(contentSchema.safeParse({ ...nightTrain, rows: 12 }).success).toBe(false);
    expect(
      contentSchema.safeParse({ ...nightTrain, rowCounts: nightTrain.rowCounts.slice(1) }).success,
    ).toBe(false);
  });

  it("rejects a given piece outside the grid", () => {
    expect(
      contentSchema.safeParse({
        ...nightTrain,
        given: [{ row: 7, col: 0, piece: "ns" }],
      }).success,
    ).toBe(false);
  });
});
