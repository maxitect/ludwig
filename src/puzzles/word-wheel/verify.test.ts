import { describe, expect, it } from "vitest";
import { readDictionaryFile } from "../word-ladder/dictionary";
import { verifyWheel } from "./verify";

const content = {
  targetWord: "adventure",
  centrePosition: 2,
  scrambleSeed: 1,
  minLength: 4,
};

describe("verifyWheel", () => {
  it("accepts a wheel with one nine-letter word and enough valid words", () => {
    expect(() => verifyWheel(content, readDictionaryFile())).not.toThrow();
  });

  it("rejects a wheel whose letters make two nine-letter words", () => {
    expect(() =>
      verifyWheel({ ...content, targetWord: "gnarliest", centrePosition: 0 }, [
        "gnarliest",
        "triangles",
      ]),
    ).toThrow(/2 nine-letter words/);
  });

  it("rejects a target that is not nine letters or not in the dictionary", () => {
    expect(() =>
      verifyWheel({ ...content, targetWord: "venture" }, ["venture"]),
    ).toThrow(/not nine letters/);
    expect(() => verifyWheel(content, ["venue"])).toThrow(
      /not in the dictionary/,
    );
  });

  it("rejects a wheel with fewer than 15 valid words", () => {
    expect(() =>
      verifyWheel(content, ["adventure", "venue", "dune", "vent", "vend"]),
    ).toThrow(/only 4 valid words, at least 15 needed/);
  });
});
