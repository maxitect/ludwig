import { describe, expect, it } from "vitest";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("payloadSchema", () => {
  const payload = { startWord: "cold", endWord: "warm", rungCount: 3 };

  it("parses the endpoints and the rung count", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it.each(["rungs", "reference", "solution", "dictionary"])(
    "rejects a payload carrying %s",
    (key) => {
      expect(
        payloadSchema.strict().safeParse({ ...payload, [key]: ["wold"] })
          .success,
      ).toBe(false);
    },
  );
});

describe("answerSchema", () => {
  it("takes the whole ladder of lowercase words", () => {
    expect(
      answerSchema.safeParse({ ladder: ["cold", "wold", "word", "warm"] })
        .success,
    ).toBe(true);
    expect(answerSchema.safeParse({ ladder: ["cold", "Wold", "warm"] }).success).toBe(
      false,
    );
    expect(answerSchema.safeParse({ ladder: ["cold", "warm"] }).success).toBe(false);
  });
});

describe("attemptSchema", () => {
  it("accepts partial words and rejects other characters", () => {
    expect(
      attemptSchema.safeParse({ rungs: [{ position: 0, word: "wo" }] }).success,
    ).toBe(true);
    expect(
      attemptSchema.safeParse({ rungs: [{ position: 0, word: "w0" }] }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  it("needs at least one rung", () => {
    const content = { startWord: "mate", endWord: "move", rungs: [] };
    expect(contentSchema.safeParse(content).success).toBe(false);
    expect(
      contentSchema.safeParse({ ...content, rungs: ["mote"] }).success,
    ).toBe(true);
  });
});
