import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = { ruleLabel: "x", lines: ["a"] };

describe("check", () => {
  it.each(["ILOVEYOU", "i love you", "  I.   Love-You! ", "I LOVE YOU"])(
    "accepts %j, ignoring case, spaces and punctuation",
    (answer) => {
      expect(check(payload, "ILOVEYOU", { answer }).correct).toBe(true);
    },
  );

  it.each(["I LOVE YO", "I LOVE YOU TOO", "ILOVEYOUU", "1 love you 2"])(
    "rejects %j",
    (answer) => {
      expect(check(payload, "ILOVEYOU", { answer }).correct).toBe(false);
    },
  );

  it("returns only { correct }", () => {
    expect(Object.keys(check(payload, "ABCD", { answer: "abcd" }))).toEqual([
      "correct",
    ]);
  });
});
