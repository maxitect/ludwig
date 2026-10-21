import { describe, expect, it } from "vitest";
import {
  deriveWheel,
  fitFailure,
  fits,
  ratingFor,
  ratingThresholds,
  validWords,
} from "./engine";

const wheel = deriveWheel("adventure", 2, 7);

describe("deriveWheel", () => {
  it("takes the centre from the target and shuffles the other eight letters by the seed", () => {
    expect(wheel.centre).toBe("v");
    expect([...wheel.rim].sort().join("")).toBe("adeenrtu");
    expect(deriveWheel("adventure", 2, 7)).toEqual(wheel);
    expect(deriveWheel("adventure", 2, 8).rim).not.toEqual(wheel.rim);
  });
});

describe("fits", () => {
  it("accepts a word that uses the centre and no letter too often", () => {
    expect(fits(wheel, 4, "venue")).toBe(true);
    expect(fits(wheel, 4, "adventure")).toBe(true);
  });

  it("rejects a word without the centre letter", () => {
    expect(fitFailure(wheel, 4, "tuned")).toBe("missing-centre");
    expect(fits(wheel, 4, "nature")).toBe(false);
  });

  it("rejects a word that uses a letter more often than the wheel has it", () => {
    expect(fitFailure(wheel, 4, "venues")).toBe("letters");
    expect(fitFailure(wheel, 4, "vivid")).toBe("letters");
    expect(fitFailure(wheel, 4, "evened")).toBe("letters");
    expect(fitFailure(wheel, 4, "venue")).toBeNull();
  });

  it("rejects a word that is too short, before any other test", () => {
    expect(fitFailure(wheel, 4, "vet")).toBe("too-short");
    expect(fitFailure(wheel, 5, "vend")).toBe("too-short");
    expect(fitFailure(wheel, 5, "venue")).toBeNull();
  });
});

describe("validWords", () => {
  it("keeps the fitting words once each", () => {
    expect(
      validWords(wheel, 4, ["venue", "venue", "nature", "vet", "tuned", "dune"]),
    ).toEqual(["venue"]);
  });
});

describe("ratings", () => {
  it("sets thresholds at a third, a half and two thirds, rounded down", () => {
    expect(ratingThresholds(31)).toEqual({ average: 10, good: 15, genius: 20 });
    expect(ratingThresholds(15)).toEqual({ average: 5, good: 7, genius: 10 });
  });

  it("rates a count against the thresholds", () => {
    const thresholds = { average: 5, good: 7, genius: 10 };
    expect(
      [0, 4, 5, 7, 9, 10, 40].map((n) => ratingFor(n, thresholds)),
    ).toEqual([null, null, "Average", "Good", "Good", "Genius", "Genius"]);
  });
});
