import { describe, expect, it } from "vitest";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("payloadSchema", () => {
  const payload = {
    title: "T",
    author: "A",
    lines: [{ page: 1, line: 1, content: "one two" }],
    refs: [{ position: 0, page: 1, line: 1, wordIndex: 2 }],
  };

  it("parses the text and the references", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it.each(["plaintext", "words", "answer"])(
    "rejects a payload carrying %s",
    (key) => {
      expect(
        payloadSchema.strict().safeParse({ ...payload, [key]: "two" }).success,
      ).toBe(false);
    },
  );
});

describe("contentSchema", () => {
  const ref = { page: 1, line: 2, wordIndex: 3 };

  it("takes a text slug and 3 to 12 references", () => {
    expect(
      contentSchema.safeParse({ textSlug: "x", refs: [ref, ref, ref] }).success,
    ).toBe(true);
    expect(
      contentSchema.safeParse({ textSlug: "x", refs: [ref, ref] }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({ textSlug: "x", refs: Array(13).fill(ref) })
        .success,
    ).toBe(false);
  });

  it("rejects a zero word index", () => {
    expect(
      contentSchema.safeParse({
        textSlug: "x",
        refs: [ref, ref, { ...ref, wordIndex: 0 }],
      }).success,
    ).toBe(false);
  });
});

describe("answerSchema and attemptSchema", () => {
  it("takes any non-empty text as an answer", () => {
    expect(answerSchema.safeParse({ answer: "a b c" }).success).toBe(true);
    expect(answerSchema.safeParse({ answer: "" }).success).toBe(false);
  });

  it("saves words with underscores for empty ones", () => {
    expect(attemptSchema.safeParse({ answer: "never _ them" }).success).toBe(
      true,
    );
    expect(attemptSchema.safeParse({ answer: null }).success).toBe(true);
    expect(attemptSchema.safeParse({ answer: "Never" }).success).toBe(false);
  });
});
