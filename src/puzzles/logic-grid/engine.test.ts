import { describe, expect, it } from "vitest";
import { classic, classicAmbiguous, variant } from "./fixture";
import { findWorlds, holds, solutionWorld } from "./engine";

const truth = [
  [0, 1, 2],
  [0, 1, 2],
  [0, 1, 2],
];

describe("solutionWorld", () => {
  it("numbers households by the first category's item order", () => {
    expect(solutionWorld(classic)).toEqual(truth);
  });

  it("renumbers when the solution rows are in another order", () => {
    expect(
      solutionWorld({
        categories: classic.categories,
        solution: [classic.solution[2], classic.solution[0], classic.solution[1]],
      }),
    ).toEqual(truth);
  });
});

describe("holds", () => {
  const { categories } = classic;

  it("reads is, isNot and either against a world", () => {
    expect(holds(categories, truth, { kind: "is", a: "Ann", b: "Dog" })).toBe(true);
    expect(holds(categories, truth, { kind: "is", a: "Ann", b: "Eel" })).toBe(false);
    expect(holds(categories, truth, { kind: "isNot", a: "Ann", b: "Eel" })).toBe(true);
    expect(holds(categories, truth, { kind: "isNot", a: "Ann", b: "Dog" })).toBe(false);
    expect(
      holds(categories, truth, { kind: "either", a: "Bob", b: "Blue", c: "Red" }),
    ).toBe(true);
    expect(
      holds(categories, truth, { kind: "either", a: "Bob", b: "Red", c: "Green" }),
    ).toBe(false);
  });

  it("throws for an item the puzzle does not have", () => {
    expect(() =>
      holds(categories, truth, { kind: "is", a: "Ann", b: "Cow" }),
    ).toThrow(/unknown item "Cow"/);
  });
});

describe("findWorlds", () => {
  it("finds exactly the stored world for a classic puzzle", () => {
    expect(findWorlds(classic, 5)).toEqual([truth]);
  });

  it("finds both worlds of an ambiguous puzzle: Bob and Cat swap Blue and Green", () => {
    const worlds = findWorlds(classicAmbiguous, 5);
    expect(worlds).toHaveLength(2);
    expect(worlds).toContainEqual(truth);
    expect(worlds).toContainEqual([
      [0, 1, 2],
      [0, 1, 2],
      [0, 2, 1],
    ]);
  });

  it("stops at the limit", () => {
    expect(findWorlds(classicAmbiguous, 1)).toHaveLength(1);
  });

  it("finds no world when the clues contradict each other", () => {
    expect(findWorlds(variant, 5)).toEqual([]);
  });

  it("finds the stored world when the false clue is skipped, and none when a true clue is", () => {
    expect(findWorlds(variant, 5, 4)).toEqual([truth]);
    expect(findWorlds(variant, 5, 0)).toEqual([]);
    expect(findWorlds(variant, 5, 1)).toEqual([]);
    expect(findWorlds(variant, 5, 3)).toEqual([]);
  });

  it("finds the three worlds that remain when Ann's hat is unconstrained", () => {
    expect(findWorlds(variant, 10, 2)).toHaveLength(3);
  });
});
