import { describe, expect, it } from "vitest";
import { verifyPictogramCipher } from "./verify";

const plaintext = "paper boats cannot cross the river twice";
const given = ["e", "t", "o", "a", "r"];

describe("verifyPictogramCipher", () => {
  it("accepts a long, varied message whose glyphs can be inferred", () => {
    expect(() => verifyPictogramCipher({ plaintext, given })).not.toThrow();
  });

  it("rejects a message under 20 letters", () => {
    expect(() =>
      verifyPictogramCipher({ plaintext: "the old clock", given: ["e"] }),
    ).toThrow("11 letters");
  });

  it("rejects a message with fewer than 8 distinct glyphs", () => {
    expect(() =>
      verifyPictogramCipher({
        plaintext: "ababab ababab ababab ababab",
        given: ["a"],
      }),
    ).toThrow("2 distinct glyphs");
  });

  it("rejects a glyph that cannot be inferred", () => {
    expect(() =>
      verifyPictogramCipher({ plaintext, given: ["e"] }),
    ).toThrow("cannot be inferred");
  });

  it("rejects a given glyph the message never uses", () => {
    expect(() =>
      verifyPictogramCipher({ plaintext, given: [...given, "z"] }),
    ).toThrow("do not occur");
  });

  it("rejects a given glyph listed twice", () => {
    expect(() =>
      verifyPictogramCipher({ plaintext, given: [...given, "e"] }),
    ).toThrow("listed twice");
  });

  it("rejects a puzzle with nothing left to solve", () => {
    expect(() =>
      verifyPictogramCipher({
        plaintext,
        given: [...new Set(plaintext.replace(/ /g, ""))],
      }),
    ).toThrow("nothing is left");
  });
});
