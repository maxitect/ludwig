import { describe, expect, it } from "vitest";
import { check, checkLadder } from "./check";
import { letterDifferences } from "./derive";

const payload = { startWord: "cold", endWord: "warm", rungCount: 3 };
const dictionary = new Set([
  "cold",
  "cord",
  "card",
  "ward",
  "warm",
  "wold",
  "word",
  "worm",
  "corm",
  "core",
  "wore",
  "ware",
]);
const isWord = (word: string) => dictionary.has(word);
const run = (ladder: string[]) => checkLadder(payload, ladder, isWord);

describe("letterDifferences", () => {
  it("counts the positions that differ", () => {
    expect(letterDifferences("cold", "cord")).toBe(1);
    expect(letterDifferences("cold", "card")).toBe(2);
    expect(letterDifferences("cold", "cold")).toBe(0);
  });

  it("never counts words of different lengths as one step", () => {
    expect(letterDifferences("cold", "col")).toBe(Infinity);
  });
});

describe("checkLadder", () => {
  it("accepts the reference ladder", () => {
    expect(run(["cold", "wold", "word", "ward", "warm"]).correct).toBe(true);
  });

  it("accepts a different valid ladder of the same length", () => {
    const other = run(["cold", "cord", "corm", "worm", "warm"]);
    expect(other).toEqual({ correct: true, rungProblems: [] });
  });

  it("rejects a step that changes two letters", () => {
    const result = run(["cold", "card", "ward", "ware", "warm"]);
    expect(result.correct).toBe(false);
    expect(result.rungProblems).toContainEqual({
      position: 0,
      reason: "not-one-step",
    });
  });

  it("rejects a last rung that is two letters from the end word", () => {
    const result = run(["cold", "cord", "core", "wore", "warm"]);
    expect(result.correct).toBe(false);
    expect(result.rungProblems).toEqual([
      { position: 2, reason: "not-one-step" },
    ]);
  });

  it("rejects a rung that is not a word", () => {
    const result = run(["cold", "cord", "cork", "worm", "warm"]);
    expect(result.correct).toBe(false);
    expect(result.rungProblems).toContainEqual({
      position: 1,
      reason: "not-a-word",
    });
  });

  it("rejects the wrong number of rungs", () => {
    expect(run(["cold", "cord", "ward", "warm"]).correct).toBe(false);
    expect(
      run(["cold", "wold", "word", "worm", "corm", "warm"]).correct,
    ).toBe(false);
  });

  it("rejects a ladder that starts or ends at the wrong word", () => {
    expect(run(["cord", "wold", "word", "ward", "warm"]).correct).toBe(false);
    expect(run(["cold", "wold", "word", "ward", "ware"]).correct).toBe(false);
  });

  it("rejects a repeated word", () => {
    const result = run(["cold", "cord", "cold", "cord", "ward"]);
    expect(result.correct).toBe(false);
    expect(result.rungProblems.some(({ reason }) => reason === "repeated")).toBe(
      true,
    );
  });
});

describe("check", () => {
  const solution = { dictionary: [...dictionary] };

  it("looks the rungs up in the loaded dictionary", () => {
    expect(
      check(payload, solution, { ladder: ["cold", "cord", "corm", "worm", "warm"] })
        .correct,
    ).toBe(true);
    expect(
      check(
        payload,
        { ...solution, dictionary: ["cold", "warm"] },
        { ladder: ["cold", "wold", "word", "ward", "warm"] },
      ).correct,
    ).toBe(false);
  });
});
