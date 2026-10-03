// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readAllProgress } from "./local-progress";

const puzzleId = "8b080c63-b083-4de6-8fcf-66189c57a73e";
const entry = JSON.stringify({
  typeKey: "anagram",
  state: { answer: "abc" },
  startedAt: 1,
});

beforeEach(() => localStorage.clear());

describe("readAllProgress", () => {
  it("returns valid entries and discards a key that is not a puzzle id", () => {
    localStorage.setItem(`ludwig:progress:${puzzleId}`, entry);
    localStorage.setItem("ludwig:progress:not-a-uuid", entry);
    expect(readAllProgress().map((item) => item.puzzleId)).toEqual([puzzleId]);
    expect(localStorage.getItem("ludwig:progress:not-a-uuid")).toBeNull();
  });
});
