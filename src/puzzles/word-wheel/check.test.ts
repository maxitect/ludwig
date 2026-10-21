import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = {
  centre: "v",
  rim: ["a", "d", "e", "n", "r", "t", "u", "e"],
  minLength: 4,
  thresholds: { average: 1, good: 2, genius: 3 },
};

describe("check", () => {
  it("accepts the target word", () => {
    expect(check(payload, "adventure", { word: "adventure" }).correct).toBe(
      true,
    );
  });

  it("rejects any other word, even a valid one", () => {
    expect(check(payload, "adventure", { word: "venue" }).correct).toBe(false);
    expect(check(payload, "adventure", { word: "adventurf" }).correct).toBe(
      false,
    );
  });
});
