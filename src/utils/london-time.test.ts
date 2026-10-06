import { describe, expect, it } from "vitest";
import {
  addDays,
  daysSinceEpoch,
  isMonday,
  londonDate,
  londonMidnight,
  londonWeekStart,
} from "./london-time";

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

describe("londonDate", () => {
  it("uses GMT in winter", () => {
    expect(londonDate(new Date("2026-01-15T23:59:59Z"))).toBe("2026-01-15");
    expect(londonDate(new Date("2026-01-16T00:00:00Z"))).toBe("2026-01-16");
  });

  it("uses BST in summer", () => {
    expect(londonDate(new Date("2026-07-05T22:59:59Z"))).toBe("2026-07-05");
    expect(londonDate(new Date("2026-07-05T23:00:00Z"))).toBe("2026-07-06");
  });

  it("follows the clock changes", () => {
    expect(londonDate(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-28");
    expect(londonDate(new Date("2026-03-29T23:30:00Z"))).toBe("2026-03-30");
    expect(londonDate(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(londonDate(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-25");
  });
});

describe("addDays and daysSinceEpoch", () => {
  it("steps calendar dates across month, year and leap boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-10-06", 365)).toBe("2027-10-06");
  });

  it("counts whole days from 1970-01-01", () => {
    expect(daysSinceEpoch("1970-01-01")).toBe(0);
    expect(daysSinceEpoch("1970-01-05")).toBe(4);
    expect(daysSinceEpoch(addDays("2026-10-06", 1)) - daysSinceEpoch("2026-10-06")).toBe(1);
  });
});
