import { describe, expect, it } from "vitest";
import {
  cipherLettersIn,
  decodeLetters,
  duplicatedGuesses,
  guessesFromLetters,
  isComplete,
  lettersOf,
} from "./cipher-key";

describe("cipher-key helpers", () => {
  it("lowercases and drops everything but letters", () => {
    expect(lettersOf("DWW, DFN 3!")).toBe("dwwdfn");
  });

  it("lists the distinct cipher letters alphabetically", () => {
    expect(cipherLettersIn("DWWDFN DW")).toEqual(["d", "f", "n", "w"]);
  });

  it("decodes with an underscore for each unguessed letter", () => {
    expect(decodeLetters("DWWDFN", { d: "a", w: "t" })).toBe("atta__");
  });

  it("restores guesses from a saved decode, position by position", () => {
    expect(guessesFromLetters("DWWDFN", "atta__")).toEqual({ d: "a", w: "t" });
    expect(guessesFromLetters("DWWDFN", "attack")).toEqual({
      d: "a",
      w: "t",
      f: "c",
      n: "k",
    });
  });

  it("drops a saved decode that does not line up", () => {
    expect(guessesFromLetters("DWWDFN", "att")).toEqual({});
    expect(guessesFromLetters("DWWDFN", null)).toEqual({});
  });

  it("is complete only when every distinct letter has a guess", () => {
    expect(isComplete("DWWDFN", { d: "a", w: "t", f: "c" })).toBe(false);
    expect(isComplete("DWWDFN", { d: "a", w: "t", f: "c", n: "k" })).toBe(true);
  });

  it("reports plain letters guessed for more than one cipher letter", () => {
    expect([...duplicatedGuesses({ a: "x", b: "x", c: "y" })]).toEqual(["x"]);
  });
});
