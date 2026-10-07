import { describe, expect, it } from "vitest";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("payloadSchema", () => {
  it("parses a ciphertext", () => {
    const payload = { ciphertext: "LRRLDF LR WLVK" };
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it.each(["plaintext", "keyword"])("rejects a payload carrying %s", (key) => {
    expect(
      payloadSchema
        .strict()
        .safeParse({ ciphertext: "LRRLDF", [key]: "ludwig" }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  const content = { plaintext: "attack at dawn", keyword: "ludwig" };

  it("accepts a lowercase message and a keyword of 3 to 12 letters", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
  });

  it.each(["lu", "lud wig", "lud-wig", "Ludwig", "l2dwig", "abcdefghijklm"])(
    "rejects the keyword %j",
    (keyword) => {
      expect(contentSchema.safeParse({ ...content, keyword }).success).toBe(
        false,
      );
    },
  );

  it.each(["Attack at dawn", "", "attack @ dawn"])(
    "rejects the plaintext %j",
    (plaintext) => {
      expect(contentSchema.safeParse({ ...content, plaintext }).success).toBe(
        false,
      );
    },
  );
});

describe("answerSchema and attemptSchema", () => {
  it("takes any non-empty text as an answer", () => {
    expect(answerSchema.safeParse({ answer: "Attack at dawn!" }).success).toBe(
      true,
    );
    expect(answerSchema.safeParse({ answer: "" }).success).toBe(false);
  });

  it("saves decoded letters with underscores for unguessed ones", () => {
    expect(attemptSchema.safeParse({ answer: "att_ck" }).success).toBe(true);
    expect(attemptSchema.safeParse({ answer: null }).success).toBe(true);
    expect(attemptSchema.safeParse({ answer: "ATT" }).success).toBe(false);
  });
});
