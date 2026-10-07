import { describe, expect, it } from "vitest";
import { pictogramGlyphs } from "../../../content/lookups";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("payloadSchema", () => {
  const payload = {
    words: [["glyph-01", "glyph-02"], ["glyph-02"]],
    given: [{ assetKey: "glyph-02", letter: "h" }],
  };

  it("parses glyph keys and the given glyphs' letters", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it.each(["plaintext", "letters", "glyphs", "answer"])(
    "rejects a payload carrying %s",
    (key) => {
      expect(
        payloadSchema.strict().safeParse({ ...payload, [key]: "hh" }).success,
      ).toBe(false);
    },
  );

  it("rejects a letter on a symbol, so a glyph cannot carry its letter", () => {
    expect(
      payloadSchema.strict().safeParse({
        ...payload,
        words: [[{ assetKey: "glyph-01", letter: "q" }]],
      }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  it("takes lowercase words and the given letters", () => {
    expect(
      contentSchema.safeParse({ plaintext: "ab cd", given: ["a"] }).success,
    ).toBe(true);
  });

  it.each(["", "   ", " ab", "ab ", "ab  cd", "Ab", "ab1", "a-b"])(
    "rejects the plaintext %j",
    (plaintext) => {
      expect(contentSchema.safeParse({ plaintext, given: ["a"] }).success).toBe(
        false,
      );
    },
  );

  it.each([[[]], [["ab"]], [[" "]], [["A"]]])(
    "rejects the given letters %j",
    (given) => {
      expect(
        contentSchema.safeParse({ plaintext: "ab cd", given }).success,
      ).toBe(false);
    },
  );
});

describe("answerSchema and attemptSchema", () => {
  it("takes any non-empty text as an answer", () => {
    expect(answerSchema.safeParse({ answer: "a b" }).success).toBe(true);
    expect(answerSchema.safeParse({ answer: "" }).success).toBe(false);
  });

  it("saves guesses as glyph key and letter, none at all being valid", () => {
    expect(attemptSchema.safeParse({ guesses: [] }).success).toBe(true);
    expect(
      attemptSchema.safeParse({
        guesses: [{ assetKey: "glyph-01", letter: "a" }],
      }).success,
    ).toBe(true);
    expect(
      attemptSchema.safeParse({
        guesses: [{ assetKey: "glyph-01", letter: "A" }],
      }).success,
    ).toBe(false);
  });
});

describe("the glyph alphabet", () => {
  it("has 26 glyphs with unique keys, ids and letters, none named for a letter", () => {
    expect(pictogramGlyphs).toHaveLength(26);
    expect(new Set(pictogramGlyphs.map((glyph) => glyph.id)).size).toBe(26);
    expect(new Set(pictogramGlyphs.map((glyph) => glyph.assetKey)).size).toBe(26);
    expect(new Set(pictogramGlyphs.map((glyph) => glyph.letter)).size).toBe(26);
    for (const { assetKey } of pictogramGlyphs) {
      expect(assetKey).toMatch(/^glyph-\d{2}$/);
    }
  });
});
