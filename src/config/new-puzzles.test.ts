import { describe, expect, it } from "vitest";
import { isNewlyPublished } from "./new-puzzles";

const now = new Date("2026-11-07T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

describe("isNewlyPublished", () => {
  it("is new for 14 days and then not", () => {
    expect(isNewlyPublished(daysAgo(1), now)).toBe(true);
    expect(isNewlyPublished(daysAgo(13.9), now)).toBe(true);
    expect(isNewlyPublished(daysAgo(15), now)).toBe(false);
    expect(isNewlyPublished(daysAgo(20), now)).toBe(false);
  });

  it("is not new when a draft or scheduled for later", () => {
    expect(isNewlyPublished(null, now)).toBe(false);
    expect(isNewlyPublished(daysAgo(-1), now)).toBe(false);
  });
});
