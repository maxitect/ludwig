import { describe, expect, it } from "vitest";
import { pictogramGlyphs } from "../../../content/lookups";
import { derivePlaintext, glyphCipher, glyphKeys, symbolName } from "./derive";

const words = [
  ["glyph-07", "glyph-02", "glyph-07"],
  ["glyph-12", "glyph-02"],
];

describe("derivePlaintext", () => {
  it("spells each glyph's letter, words separated by a space", () => {
    expect(
      derivePlaintext({
        words: [
          ["t", "o", "t"],
          ["a", "o"],
        ],
      }),
    ).toBe("tot ao");
  });

  it("matches the real alphabet: the eyeball glyph is e", () => {
    const letterOf = Object.fromEntries(
      pictogramGlyphs.map(({ assetKey, letter }) => [assetKey, letter]),
    );
    expect(
      derivePlaintext({
        words: [["glyph-20", "glyph-03"]].map((word) =>
          word.map((key) => letterOf[key]),
        ),
      }),
    ).toBe("ex");
  });
});

describe("glyphKeys", () => {
  it("lists each glyph once, in numeric order", () => {
    expect(glyphKeys({ words })).toEqual(["glyph-02", "glyph-07", "glyph-12"]);
  });
});

describe("symbolName", () => {
  it.each([
    ["glyph-07", "Symbol 7"],
    ["glyph-26", "Symbol 26"],
    ["glyph-01", "Symbol 1"],
  ])("names %s %s", (key, name) => {
    expect(symbolName(key)).toBe(name);
  });

  it("never names a letter", () => {
    for (const { assetKey } of pictogramGlyphs) {
      expect(symbolName(assetKey)).toMatch(/^Symbol \d{1,2}$/);
    }
  });
});

describe("glyphCipher", () => {
  const cipher = glyphCipher({ words });

  it("stands in a puzzle-local letter per glyph, in key order, words kept", () => {
    expect(cipher.ciphertext).toBe("bab ca");
    expect(cipher.letterOf("glyph-02")).toBe("a");
    expect(cipher.assetKeyOf("c")).toBe("glyph-12");
  });
});
