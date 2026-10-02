import { describe, expect, it } from "vitest";
import { deriveTiles, deriveWordLengths, lettersOf } from "./derive";

describe("lettersOf", () => {
  it("lowercases and drops everything but letters", () => {
    expect(lettersOf("Ink, and Paper!")).toBe("inkandpaper");
  });
});

describe("deriveWordLengths", () => {
  it("counts the letters of each word", () => {
    expect(deriveWordLengths("ink and paper")).toEqual([3, 3, 5]);
    expect(deriveWordLengths("bridge")).toEqual([6]);
  });

  it("ignores extra whitespace", () => {
    expect(deriveWordLengths("  ink   and ")).toEqual([3, 3]);
  });
});

describe("deriveTiles", () => {
  const sorted = (letters: string[]) => [...letters].sort().join("");

  it("is a permutation of the answer letters", () => {
    expect(sorted(deriveTiles("ink and paper", 1904))).toBe(
      sorted([..."inkandpaper"]),
    );
  });

  it("is stable for a fixed seed", () => {
    expect(deriveTiles("lantern", 1902).join("")).toBe("nalretn");
    expect(deriveTiles("bridge", 1901).join("")).toBe("irbged");
    expect(deriveTiles("abc", 0).join("")).toBe("bca");
  });

  it("differs between seeds for the same answer", () => {
    const scrambles = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        deriveTiles("cathedral", seed).join(""),
      ),
    );
    expect(scrambles.size).toBeGreaterThan(1);
  });

  it("never returns the answer itself", () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(deriveTiles("ab", seed).join("")).toBe("ba");
    }
  });

  it("throws when no distinct scramble exists", () => {
    expect(() => deriveTiles("aaa", 1)).toThrow("No distinct scramble");
  });
});
