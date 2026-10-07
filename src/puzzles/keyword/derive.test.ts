import { describe, expect, it } from "vitest";
import { deriveCiphertext, keywordAlphabet } from "./derive";

describe("keywordAlphabet", () => {
  it("writes the keyword once, then the rest of the alphabet in order", () => {
    expect(keywordAlphabet("ludwig")).toBe("ludwigabcefhjkmnopqrstvxyz");
  });

  it("drops repeated keyword letters", () => {
    expect(keywordAlphabet("letter")).toBe("letrabcdfghijkmnopqsuvwxyz");
  });

  it("is always a permutation of the 26 letters", () => {
    for (const keyword of ["ludwig", "zebra", "letter", "mississippi"]) {
      expect([...keywordAlphabet(keyword)].sort().join("")).toBe(
        "abcdefghijklmnopqrstuvwxyz",
      );
    }
  });
});

describe("deriveCiphertext", () => {
  it("enciphers with the keyword LUDWIG", () => {
    expect(deriveCiphertext("attack", "ludwig")).toBe("LRRLDF");
    expect(deriveCiphertext("ludwig", "ludwig")).toBe("HSWVCA");
  });

  it("passes spaces, digits and punctuation through unchanged", () => {
    expect(deriveCiphertext("Attack at 9, dawn!", "ludwig")).toBe(
      "LRRLDF LR 9, WLVK!",
    );
  });
});
