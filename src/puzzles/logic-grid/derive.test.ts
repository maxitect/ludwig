import { describe, expect, it } from "vitest";
import {
  answerFromMarks,
  falseCluePosition,
  isVariant,
  linkedPairs,
  pairKey,
} from "./derive";
import { classicSolution, itemId, payload } from "./fixture";
import type { AttemptState } from "./schema";

const yes = (a: [number, number], b: [number, number]) => ({
  itemAId: itemId(...a),
  itemBId: itemId(...b),
  mark: "yes" as const,
});

const households: AttemptState["marks"] = [
  yes([0, 0], [1, 0]),
  yes([0, 0], [2, 0]),
  yes([0, 1], [1, 1]),
  yes([0, 1], [2, 1]),
  yes([0, 2], [1, 2]),
  yes([0, 2], [2, 2]),
];

describe("isVariant", () => {
  it("is true exactly when a clue is false", () => {
    expect(isVariant([])).toBe(false);
    expect(isVariant([{ isFalse: false }, { isFalse: false }])).toBe(false);
    expect(isVariant([{ isFalse: false }, { isFalse: true }])).toBe(true);
    expect(isVariant([{ isFalse: true }])).toBe(true);
  });
});

describe("falseCluePosition", () => {
  it("is the position of the false clue, or null", () => {
    expect(
      falseCluePosition([
        { position: 0, isFalse: false },
        { position: 1, isFalse: false },
      ]),
    ).toBeNull();
    expect(
      falseCluePosition([
        { position: 0, isFalse: false },
        { position: 4, isFalse: true },
      ]),
    ).toBe(4);
  });
});

describe("linkedPairs", () => {
  it("closes the links over households: three households of three items make nine pairs", () => {
    const pairs = linkedPairs(payload, classicSolution.links);
    expect(pairs.size).toBe(9);
    expect(pairs.has(pairKey(itemId(1, 0), itemId(2, 0)))).toBe(true);
    expect(pairs.has(pairKey(itemId(1, 0), itemId(2, 1)))).toBe(false);
  });

  it("ignores links to items the puzzle does not have", () => {
    const pairs = linkedPairs(payload, [
      { itemAId: itemId(0, 0), itemBId: "00000000-0000-4000-8000-0000000000ff" },
    ]);
    expect(pairs.size).toBe(0);
  });

  it("orders a pair the same way round both ways", () => {
    expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
  });
});

describe("answerFromMarks", () => {
  it("returns every pair of every household once the yes marks complete them", () => {
    const links = answerFromMarks(payload, households);
    expect(links).toHaveLength(9);
    expect(linkedPairs(payload, links ?? []).size).toBe(9);
  });

  it("ignores no marks", () => {
    const noted = [...households, { ...households[0], itemBId: itemId(1, 1), mark: "no" as const }];
    expect(answerFromMarks(payload, noted)).toHaveLength(9);
  });

  it("is null until every item sits in a household with one item of each category", () => {
    expect(answerFromMarks(payload, [])).toBeNull();
    expect(answerFromMarks(payload, households.slice(0, 5))).toBeNull();
    expect(
      answerFromMarks(payload, [
        ...households.slice(0, 5),
        yes([0, 2], [1, 1]),
      ]),
    ).toBeNull();
  });

  it("is null when a household holds two items of one category", () => {
    expect(
      answerFromMarks(payload, [
        yes([0, 0], [1, 0]),
        yes([0, 0], [1, 1]),
        yes([0, 0], [2, 0]),
        yes([0, 1], [2, 1]),
        yes([0, 2], [1, 2]),
        yes([0, 2], [2, 2]),
      ]),
    ).toBeNull();
  });
});
