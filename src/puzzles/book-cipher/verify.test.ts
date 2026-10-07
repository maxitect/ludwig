import { describe, expect, it } from "vitest";
import { verifyBookCipher } from "./verify";

const slug = "natural-history-of-selborne";
const ref = (page: number, line: number, wordIndex: number) => ({
  page,
  line,
  wordIndex,
});

describe("verifyBookCipher", () => {
  it("accepts references that land on words", () => {
    expect(() =>
      verifyBookCipher({
        textSlug: slug,
        refs: [ref(1, 1, 1), ref(1, 1, 2), ref(1, 2, 1)],
      }),
    ).not.toThrow();
  });

  it("fails a word index beyond the line's word count", () => {
    expect(() =>
      verifyBookCipher({
        textSlug: slug,
        refs: [ref(1, 1, 1), ref(1, 1, 2), ref(1, 1, 99)],
      }),
    ).toThrow("word 99 does not exist");
  });

  it("fails a page or line that is not in the text", () => {
    expect(() =>
      verifyBookCipher({
        textSlug: slug,
        refs: [ref(1, 1, 1), ref(1, 1, 2), ref(99, 1, 1)],
      }),
    ).toThrow("page 99, line 1 does not exist");
  });

  it("fails an unknown text and a repeated reference", () => {
    expect(() =>
      verifyBookCipher({ textSlug: "nope", refs: [ref(1, 1, 1)] }),
    ).toThrow("no book text");
    expect(() =>
      verifyBookCipher({
        textSlug: slug,
        refs: [ref(1, 1, 1), ref(1, 1, 2), ref(1, 1, 1)],
      }),
    ).toThrow("appears twice");
  });
});
