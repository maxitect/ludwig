import { describe, expect, it } from "vitest";
import {
  answerSchema,
  attemptSchema,
  contentSchema,
  payloadSchema,
} from "./schema";

describe("payloadSchema", () => {
  it("parses a ciphertext", () => {
    const payload = { ciphertext: "DWWDFN DW GDZQ" };
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it.each(["plaintext", "shift"])("rejects a payload carrying %s", (key) => {
    expect(
      payloadSchema
        .strict()
        .safeParse({ ciphertext: "DWWDFN", [key]: "attack" }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  const content = { plaintext: "attack at dawn", shift: 3 };

  it("accepts a lowercase message with punctuation and a shift of 1 to 25", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
    expect(
      contentSchema.safeParse({ ...content, plaintext: "it's six, no seven." })
        .success,
    ).toBe(true);
    expect(contentSchema.safeParse({ ...content, shift: 25 }).success).toBe(
      true,
    );
  });

  it.each([0, 26, -3, 2.5])("rejects the shift %s", (shift) => {
    expect(contentSchema.safeParse({ ...content, shift }).success).toBe(false);
  });

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
