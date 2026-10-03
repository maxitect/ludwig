import { describe, expect, it } from "vitest";
import { isMonday, londonMidnight, londonWeekStart } from "./london-time";

describe("londonWeekStart", () => {
  it("returns the Monday of the week", () => {
    expect(londonWeekStart(new Date("2026-10-03T12:00:00Z"))).toBe("2026-09-28");
    expect(londonWeekStart(new Date("2026-09-28T12:00:00Z"))).toBe("2026-09-28");
  });

  it("splits Sunday 23:59 from Monday 00:00 London time in winter", () => {
    expect(londonWeekStart(new Date("2026-11-01T23:59:59Z"))).toBe("2026-10-26");
    expect(londonWeekStart(new Date("2026-11-02T00:00:00Z"))).toBe("2026-11-02");
  });

  it("splits Sunday 23:59 from Monday 00:00 London time in summer", () => {
    expect(londonWeekStart(new Date("2026-07-05T22:59:59Z"))).toBe("2026-06-29");
    expect(londonWeekStart(new Date("2026-07-05T23:00:00Z"))).toBe("2026-07-06");
  });

  it("uses the London date for a UTC instant on the previous day", () => {
    expect(londonWeekStart(new Date("2026-07-05T23:30:00Z"))).toBe("2026-07-06");
  });

  it("handles the clocks-change weekends", () => {
    expect(londonWeekStart(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-19");
    expect(londonWeekStart(new Date("2026-10-25T12:00:00Z"))).toBe("2026-10-19");
    expect(londonWeekStart(new Date("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
    expect(londonWeekStart(new Date("2026-03-29T12:00:00Z"))).toBe("2026-03-23");
  });
});

describe("isMonday", () => {
  it("accepts Mondays only", () => {
    expect(isMonday("2026-09-28")).toBe(true);
    expect(isMonday("2026-09-29")).toBe(false);
    expect(isMonday("2026-10-04")).toBe(false);
  });
});

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
