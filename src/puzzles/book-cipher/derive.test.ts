import { describe, expect, it } from "vitest";
import {
  deriveWord,
  derivePlaintext,
  LINES_PER_PAGE,
  LINE_WIDTH,
  normaliseWord,
  paginate,
  wordsOfLine,
} from "./derive";

const lines = [
  { page: 1, line: 1, content: "The lantern, burns low" },
  { page: 1, line: 2, content: "until Ray’s dawn -" },
  { page: 2, line: 1, content: "again" },
];

describe("paginate", () => {
  const paragraphs = [
    "one two three four five six seven eight nine ten",
    "eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen",
  ];

  it("packs words greedily into lines no wider than the limit", () => {
    const rows = paginate(paragraphs);
    expect(rows.map(({ content }) => content)).toEqual([
      "one two three four five six seven eight nine ten eleven",
      "twelve thirteen fourteen fifteen sixteen seventeen",
      "eighteen",
    ]);
    for (const { content } of rows) {
      expect(content.length).toBeLessThanOrEqual(LINE_WIDTH);
    }
  });

  it("numbers lines and pages from 1, starting a page every 20 lines", () => {
    const word = "w".repeat(LINE_WIDTH);
    const rows = paginate([Array(LINES_PER_PAGE + 2).fill(word).join(" ")]);
    expect(rows).toHaveLength(LINES_PER_PAGE + 2);
    expect(rows[0]).toMatchObject({ page: 1, line: 1 });
    expect(rows[LINES_PER_PAGE - 1]).toMatchObject({
      page: 1,
      line: LINES_PER_PAGE,
    });
    expect(rows[LINES_PER_PAGE]).toMatchObject({ page: 2, line: 1 });
  });

  it("is deterministic", () => {
    expect(paginate(paragraphs)).toEqual(paginate(paragraphs));
  });
});

describe("words", () => {
  it("splits a line on whitespace", () => {
    expect(wordsOfLine("a  b\tc")).toEqual(["a", "b", "c"]);
  });

  it("keeps only the lowercase letters of a word", () => {
    expect(normaliseWord("Ray’s,")).toBe("rays");
    expect(normaliseWord("(upupa)")).toBe("upupa");
  });
});

describe("deriveWord", () => {
  it("reads the word at page, line and word index, counting from 1", () => {
    expect(deriveWord(lines, { page: 1, line: 1, wordIndex: 1 })).toBe("the");
    expect(deriveWord(lines, { page: 1, line: 1, wordIndex: 2 })).toBe(
      "lantern",
    );
    expect(deriveWord(lines, { page: 1, line: 2, wordIndex: 2 })).toBe("rays");
    expect(deriveWord(lines, { page: 2, line: 1, wordIndex: 1 })).toBe("again");
  });

  it("rejects a word index beyond the line's word count", () => {
    expect(() =>
      deriveWord(lines, { page: 1, line: 1, wordIndex: 5 }),
    ).toThrow("has 4 words");
    expect(() =>
      deriveWord(lines, { page: 2, line: 1, wordIndex: 2 }),
    ).toThrow("has 1 words");
  });

  it("rejects a page or line that does not exist", () => {
    expect(() =>
      deriveWord(lines, { page: 3, line: 1, wordIndex: 1 }),
    ).toThrow("does not exist");
    expect(() =>
      deriveWord(lines, { page: 1, line: 3, wordIndex: 1 }),
    ).toThrow("does not exist");
  });

  it("rejects a word with no letters", () => {
    expect(() =>
      deriveWord(lines, { page: 1, line: 2, wordIndex: 4 }),
    ).toThrow("no letters");
  });
});

describe("derivePlaintext", () => {
  it("joins the referenced words in reference order", () => {
    expect(
      derivePlaintext(lines, [
        { page: 2, line: 1, wordIndex: 1 },
        { page: 1, line: 1, wordIndex: 2 },
        { page: 1, line: 2, wordIndex: 3 },
      ]),
    ).toBe("again lantern dawn");
  });
});
