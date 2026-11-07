import { describe, expect, it } from "vitest";
import { isNewlyPublished } from "./new-puzzles";

const now = new Date("2026-11-07T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

describe("isNewlyPublished", () => {
  it("is new for 14 days and then not", () => {
    expect(isNewlyPublished(daysAgo(1), now)).toBe(true);
    expect(isNewlyPublished(daysAgo(13), now)).toBe(true);
    expect(isNewlyPublished(new Date(daysAgo(14).getTime() + 1), now)).toBe(
      true,
    );
    expect(isNewlyPublished(daysAgo(14), now)).toBe(false);
    expect(isNewlyPublished(daysAgo(15), now)).toBe(false);
    expect(isNewlyPublished(daysAgo(20), now)).toBe(false);
  });

  it("counts 14 × 24 hours across the London clock change", () => {
    const published = new Date("2026-10-24T23:00:00Z");
    expect(
      isNewlyPublished(published, new Date("2026-11-07T22:59:59Z")),
    ).toBe(true);
    expect(isNewlyPublished(published, new Date("2026-11-07T23:00:00Z"))).toBe(
      false,
    );
  });

  it("is not new when a draft or scheduled for later", () => {
    expect(isNewlyPublished(null, now)).toBe(false);
    expect(isNewlyPublished(daysAgo(-1), now)).toBe(false);
  });
});
