import { describe, expect, it } from "vitest";
import { verifyCaesar } from "./verify";

describe("verifyCaesar", () => {
  it("accepts a plaintext of at least 20 letters", () => {
    expect(() =>
      verifyCaesar({ plaintext: "the lantern burns until dawn", shift: 5 }),
    ).not.toThrow();
  });

  it("counts letters only", () => {
    expect(() =>
      verifyCaesar({ plaintext: "a, b, c, d, e, f, g, h, i, j, 1 2 3", shift: 5 }),
    ).toThrow("10 letters");
  });
});
