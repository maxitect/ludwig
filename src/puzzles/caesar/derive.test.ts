import { describe, expect, it } from "vitest";
import { deriveCiphertext } from "./derive";

describe("deriveCiphertext", () => {
  it("shifts by three", () => {
    expect(deriveCiphertext("attack", 3)).toBe("DWWDFN");
  });

  it("wraps past Z", () => {
    expect(deriveCiphertext("xyz", 3)).toBe("ABC");
    expect(deriveCiphertext("z", 25)).toBe("Y");
  });

  it("passes spaces, digits and punctuation through unchanged", () => {
    expect(deriveCiphertext("Hello, World! 1904", 13)).toBe(
      "URYYB, JBEYQ! 1904",
    );
  });

  it("is undone by the opposite shift", () => {
    const text = "the quick brown fox";
    expect(deriveCiphertext(deriveCiphertext(text, 9).toLowerCase(), 17)).toBe(
      text.toUpperCase(),
    );
  });
});
