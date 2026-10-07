import { describe, expect, it } from "vitest";
import { verifyKeyword } from "./verify";

const plaintext = "the lantern burns until dawn";

describe("verifyKeyword", () => {
  it("accepts a long message and a keyword of letters", () => {
    expect(() => verifyKeyword({ plaintext, keyword: "ludwig" })).not.toThrow();
  });

  it("rejects a short message", () => {
    expect(() =>
      verifyKeyword({ plaintext: "too short", keyword: "ludwig" }),
    ).toThrow("8 letters");
  });

  it("rejects a keyword with anything but letters", () => {
    expect(() => verifyKeyword({ plaintext, keyword: "lud wig" })).toThrow(
      "letters only",
    );
    expect(() => verifyKeyword({ plaintext, keyword: "lud-wig" })).toThrow(
      "letters only",
    );
  });

  it("rejects a keyword that leaves the alphabet unchanged", () => {
    expect(() => verifyKeyword({ plaintext, keyword: "abc" })).toThrow(
      "unchanged",
    );
  });
});
