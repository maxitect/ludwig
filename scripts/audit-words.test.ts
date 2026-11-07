import { describe, expect, it } from "vitest";
import { auditWords } from "./audit-words";

const grid = (rows: string[]) => ({
  cells: rows.flatMap((line, row) =>
    [...line].flatMap((letter, col) =>
      letter === "#" ? [] : [{ row, col, letter }],
    ),
  ),
});

describe("auditWords", () => {
  it("fails a word of four letters shared by two crosswords", () => {
    const repeats = auditWords([
      { typeKey: "crossword", slug: "one", content: grid(["GENES", "####A"]) },
      { typeKey: "crossword", slug: "two", content: grid(["GENES", "####A"]) },
    ]);
    expect(repeats.find(({ word }) => word === "GENES")).toMatchObject({
      crosswordRepeat: true,
      files: ["crossword/one", "crossword/two"],
    });
  });

  it("warns about a word shared with another word game", () => {
    const repeats = auditWords([
      { typeKey: "crossword", slug: "one", content: grid(["CLUES"]) },
      {
        typeKey: "word-search",
        slug: "two",
        content: { grid: [], words: ["CLUES", "ART"] },
      },
    ]);
    expect(repeats).toEqual([
      expect.objectContaining({ word: "CLUES", crosswordRepeat: false }),
    ]);
  });

  it("checks each word of a phrase answer", () => {
    const repeats = auditWords([
      { typeKey: "anagram", slug: "one", content: { answer: "ink and paper" } },
      {
        typeKey: "word-search",
        slug: "two",
        content: { grid: [], words: ["PAPER"] },
      },
    ]);
    expect(repeats).toEqual([
      expect.objectContaining({ word: "PAPER", files: ["anagram/one", "word-search/two"] }),
    ]);
  });

  it("ignores words shorter than four letters", () => {
    const repeats = auditWords([
      { typeKey: "anagram", slug: "one", content: { answer: "ear" } },
      { typeKey: "keyword", slug: "two", content: { keyword: "ear" } },
    ]);
    expect(repeats).toEqual([]);
  });
});
