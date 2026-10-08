import { describe, expect, it } from "vitest";
import { verifyWordSearch } from "./verify";

const good = { grid: ["CATZ", "ZZZZ", "ZZZD", "ZZZO", "ZZZG"], words: ["CAT", "DOG"] };

describe("verifyWordSearch", () => {
  it("accepts a grid where each word appears exactly once", () => {
    expect(() => verifyWordSearch(good)).not.toThrow();
  });

  it("rejects a word that is not in the grid", () => {
    expect(() => verifyWordSearch({ ...good, words: ["CAT", "DOG", "EEL"] })).toThrow(
      /"EEL" does not appear/,
    );
  });

  it("rejects a word that appears twice", () => {
    expect(() =>
      verifyWordSearch({ ...good, grid: ["CATZ", "ZZZZ", "ZZZD", "ZZZO", "TACG"] }),
    ).toThrow(/"CAT" appears 2 times/);
  });

  it("rejects a grid that is not full", () => {
    expect(() =>
      verifyWordSearch({ ...good, grid: ["CATZ", "ZZZ", "ZZZD", "ZZZO", "ZZZG"] }),
    ).toThrow(/grid is not full: row 2 has 3 letters/);
  });

  it("rejects a word listed twice", () => {
    expect(() => verifyWordSearch({ ...good, words: ["CAT", "CAT", "DOG"] })).toThrow(
      /"CAT" is listed twice/,
    );
  });
});
