import { describe, expect, it } from "vitest";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

const payload = {
  definitionHint: "A portable lamp",
  tiles: ["n", "a", "l"],
  wordLengths: [3],
};

describe("payloadSchema", () => {
  it("parses a payload of tiles and word lengths", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it("rejects an object that carries the answer", () => {
    expect(
      payloadSchema.strict().safeParse({ ...payload, answer: "lan" }).success,
    ).toBe(false);
  });

  it("rejects a multi-letter tile", () => {
    expect(
      payloadSchema.safeParse({ ...payload, tiles: ["na"] }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  const content = { answer: "ink and paper", scrambleSeed: 7 };

  it("accepts lowercase words separated by single spaces", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
  });

  it.each(["Ink and paper", "ink  and paper", "ink-and-paper", " ink", ""])(
    "rejects the answer %j",
    (answer) => {
      expect(contentSchema.safeParse({ ...content, answer }).success).toBe(
        false,
      );
    },
  );

  it("rejects a negative seed", () => {
    expect(
      contentSchema.safeParse({ ...content, scrambleSeed: -1 }).success,
    ).toBe(false);
  });
});

describe("answerSchema and attemptSchema", () => {
  it("require non-empty letters for an answer", () => {
    expect(answerSchema.safeParse({ answer: "lan" }).success).toBe(true);
    expect(answerSchema.safeParse({ answer: "" }).success).toBe(false);
    expect(answerSchema.safeParse({ answer: "l a" }).success).toBe(false);
  });

  it("allow a null answer for an empty attempt", () => {
    expect(attemptSchema.safeParse({ answer: null }).success).toBe(true);
    expect(attemptSchema.safeParse({ answer: "la" }).success).toBe(true);
    expect(attemptSchema.safeParse({ answer: "L!" }).success).toBe(false);
  });
});
