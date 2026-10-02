import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it.each([
    [0, "00:00"],
    [999, "00:00"],
    [65_000, "01:05"],
    [3_599_999, "59:59"],
    [3_661_000, "1:01:01"],
  ])("formats %i ms as %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
