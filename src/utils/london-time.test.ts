import { describe, expect, it } from "vitest";
import { londonMidnight } from "./london-time";

describe("londonMidnight", () => {
  it("is UTC midnight in winter", () => {
    expect(londonMidnight("2026-11-01").toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });

  it("is an hour before UTC midnight in summer", () => {
    expect(londonMidnight("2026-07-01").toISOString()).toBe(
      "2026-06-30T23:00:00.000Z",
    );
  });

  it("handles the clock-change days", () => {
    expect(londonMidnight("2026-03-29").toISOString()).toBe(
      "2026-03-29T00:00:00.000Z",
    );
    expect(londonMidnight("2026-10-25").toISOString()).toBe(
      "2026-10-24T23:00:00.000Z",
    );
  });
});
