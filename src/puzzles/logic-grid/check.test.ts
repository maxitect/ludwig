import { describe, expect, it } from "vitest";
import { check, wrongPairs } from "./check";
import {
  classic,
  classicSolution,
  itemId,
  payloadOf,
  solutionOf,
  variant,
} from "./fixture";

const link = (a: [number, number], b: [number, number]) => ({
  itemAId: itemId(...a),
  itemBId: itemId(...b),
});

/** Every pair of every household, so the answer needs no closure. */
const full = (rows: [number, number, number][]) =>
  rows.flatMap(([pet, hat, person]) => [
    link([0, person], [1, pet]),
    link([0, person], [2, hat]),
    link([1, pet], [2, hat]),
  ]);

const correct = full([
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
]);

describe("check", () => {
  it("accepts the full matching, as links from one category or across all of them", () => {
    expect(check(payloadOf(classic), classicSolution, { links: correct })).toEqual({
      correct: true,
    });
    expect(
      check(payloadOf(classic), classicSolution, { links: classicSolution.links }),
    ).toEqual({ correct: true });
  });

  it("rejects two hats swapped, and names the category pairs that differ", () => {
    const swapped = full([
      [0, 0, 0],
      [1, 2, 1],
      [2, 1, 2],
    ]);
    const answer = { links: swapped };
    expect(check(payloadOf(classic), classicSolution, answer).correct).toBe(false);
    expect(wrongPairs(payloadOf(classic), classicSolution, answer)).toEqual([
      { first: 0, second: 2 },
      { first: 1, second: 2 },
    ]);
  });

  it("names the pairs that differ when two pets are swapped and the hats stay put", () => {
    const answer = {
      links: full([
        [0, 0, 0],
        [2, 1, 1],
        [1, 2, 2],
      ]),
    };
    expect(wrongPairs(payloadOf(classic), classicSolution, answer)).toEqual([
      { first: 0, second: 1 },
      { first: 1, second: 2 },
    ]);
  });

  it("rejects an incomplete matching", () => {
    expect(
      check(payloadOf(classic), classicSolution, { links: correct.slice(0, 6) })
        .correct,
    ).toBe(false);
    expect(check(payloadOf(classic), classicSolution, { links: [] }).correct).toBe(false);
  });

  it("ignores a flagged clue for a classic puzzle", () => {
    expect(
      check(payloadOf(classic), classicSolution, {
        links: correct,
        falseCluePosition: 2,
      }).correct,
    ).toBe(true);
  });
});

describe("check in the variant", () => {
  const payload = payloadOf(variant);
  const solution = solutionOf(variant);

  it("accepts the matching with the false clue flagged", () => {
    expect(check(payload, solution, { links: correct, falseCluePosition: 4 })).toEqual({
      correct: true,
    });
  });

  it("rejects the right matching with the wrong clue, or no clue, flagged", () => {
    expect(check(payload, solution, { links: correct, falseCluePosition: 0 }).correct).toBe(false);
    expect(check(payload, solution, { links: correct, falseCluePosition: null }).correct).toBe(false);
    expect(check(payload, solution, { links: correct }).correct).toBe(false);
  });

  it("rejects the right clue with a wrong matching", () => {
    const answer = {
      links: full([
        [0, 0, 0],
        [1, 2, 1],
        [2, 1, 2],
      ]),
      falseCluePosition: 4,
    };
    expect(check(payload, solution, answer).correct).toBe(false);
  });
});
