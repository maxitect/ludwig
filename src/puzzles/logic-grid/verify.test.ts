import { describe, expect, it } from "vitest";
import {
  classic,
  classicAmbiguous,
  variant,
  variantAmbiguous,
} from "./fixture";
import type { Content } from "./schema";
import { verifyLogicGrid } from "./verify";

const withClue = (content: Content, index: number, change: object) => ({
  ...content,
  clues: content.clues.map((clue, i) => (i === index ? { ...clue, ...change } : clue)),
});

describe("verifyLogicGrid, classic", () => {
  it("accepts a puzzle with exactly one solution", () => {
    expect(() => verifyLogicGrid(classic)).not.toThrow();
  });

  it("rejects an ambiguous puzzle", () => {
    expect(() => verifyLogicGrid(classicAmbiguous)).toThrow(/more than one solution/);
  });

  it("rejects a true clue that fails in the stored solution", () => {
    expect(() =>
      verifyLogicGrid(
        withClue(classic, 0, {
          content: "Ann owns the Eel.",
          rule: { kind: "is", a: "Ann", b: "Eel" },
        }),
      ),
    ).toThrow(/clue 1 is true text but fails/);
  });
});

describe("verifyLogicGrid, variant", () => {
  it("accepts a puzzle where only the false clue's removal leaves one solution", () => {
    expect(() => verifyLogicGrid(variant)).not.toThrow();
  });

  it("rejects a variant where another clue choice also leaves one solution", () => {
    expect(() => verifyLogicGrid(variantAmbiguous)).toThrow(
      /treating clue 3 as false also gives one solution/,
    );
  });

  it("rejects a variant whose false clue is not false", () => {
    expect(() =>
      verifyLogicGrid(
        withClue(variant, 4, {
          content: "Ann does not own the Eel.",
          rule: { kind: "isNot", a: "Ann", b: "Eel" },
        }),
      ),
    ).toThrow(/clue 5 is marked false but holds/);
  });

  it("rejects a variant that leaves several solutions without the false clue", () => {
    expect(() =>
      verifyLogicGrid({ ...variant, clues: variant.clues.filter((_, i) => i !== 3) }),
    ).toThrow(/without the false clue the puzzle has more than one solution/);
  });

  it("rejects two false clues", () => {
    expect(() => verifyLogicGrid(withClue(variant, 0, { isFalse: true }))).toThrow(
      /at most one clue can be false/,
    );
  });
});

describe("verifyLogicGrid, structure", () => {
  it("rejects a clue naming an item the puzzle lacks", () => {
    expect(() =>
      verifyLogicGrid(
        withClue(classic, 0, {
          content: "Ann owns the Cow.",
          rule: { kind: "is", a: "Ann", b: "Cow" },
        }),
      ),
    ).toThrow(/unknown item "Cow"/);
  });

  it("rejects clue text that never names an item of its rule", () => {
    expect(() =>
      verifyLogicGrid(withClue(classic, 0, { content: "Somebody owns the Dog." })),
    ).toThrow(/clue 1: the text never mentions "Ann"/);
  });

  it("rejects a rule between two items of one category", () => {
    expect(() =>
      verifyLogicGrid(
        withClue(classic, 0, {
          content: "Ann is not Bob.",
          rule: { kind: "isNot", a: "Ann", b: "Bob" },
        }),
      ),
    ).toThrow(/both items are in the same category/);
  });

  it("rejects an either clue whose options are in different categories", () => {
    expect(() =>
      verifyLogicGrid(
        withClue(classic, 0, {
          content: "Ann owns the Dog or wears Red.",
          rule: { kind: "either", a: "Ann", b: "Dog", c: "Red" },
        }),
      ),
    ).toThrow(/either needs two different items of one category/);
  });

  it("rejects a repeated item label", () => {
    expect(() =>
      verifyLogicGrid({
        ...classic,
        categories: classic.categories.map((category, i) =>
          i === 1 ? { ...category, items: ["Dog", "Eel", "Red"] } : category,
        ),
      }),
    ).toThrow(/item "Red" is not unique/);
  });

  it("rejects a solution that uses an item twice", () => {
    expect(() =>
      verifyLogicGrid({
        ...classic,
        solution: [classic.solution[0], classic.solution[0], classic.solution[2]],
      }),
    ).toThrow(/"Bob" appears 0 times in the solution/);
  });

  it("rejects categories of different sizes", () => {
    expect(() =>
      verifyLogicGrid({
        ...classic,
        categories: [
          ...classic.categories.slice(0, 2),
          { name: "Hat", items: ["Red", "Blue", "Green", "Pink"] },
        ],
      }),
    ).toThrow(/every category needs the same number of items/);
  });
});
