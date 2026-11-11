import { describe, expect, it } from "vitest";
import { project } from "@/components/three/iso";
import {
  deskStacks,
  describeDesk,
  emptyDeskStacks,
  MAX_SHEETS,
  sheetJitter,
} from "./model";

describe("deskStacks", () => {
  it("makes one stack per category, a sheet per solve, capped, with at least one", () => {
    const stacks = deskStacks([
      { key: "flagship", name: "Flagship", solved: 0 },
      { key: "word", name: "Word", solved: 4 },
      { key: "logic", name: "Logic", solved: 400 },
      { key: "unknown", name: "Unknown", solved: 2 },
    ]);
    expect(stacks.map((stack) => stack.sheets)).toEqual([1, 4, MAX_SHEETS, 2]);
    expect(stacks.map((stack) => stack.marker)).toEqual([
      "flagship",
      "word",
      "logic",
      null,
    ]);
  });

  it("lays the six categories out on distinct spots", () => {
    const spots = emptyDeskStacks().map(({ x, z }) => `${x}:${z}`);
    expect(new Set(spots).size).toBe(6);
  });

  it("describes every stack in text", () => {
    const lines = describeDesk(deskStacks([{ key: "numbers", name: "Numbers", solved: 1 }]));
    expect(lines).toEqual([
      "Numbers: 1 solved, a stack of 1 sheet, topped with a red pencil.",
    ]);
  });
});

describe("sheetJitter", () => {
  it("is deterministic and small", () => {
    expect(sheetJitter(2, 5)).toEqual(sheetJitter(2, 5));
    expect(Math.abs(sheetJitter(2, 5).yaw)).toBeLessThan(0.12);
  });
});

describe("project", () => {
  it("puts the origin at the centre and raises height up the screen", () => {
    const [x0, y0] = project([0, 0.3, 0]);
    const [, y1] = project([0, 1.3, 0]);
    expect(x0).toBeCloseTo(0);
    expect(y0).toBeCloseTo(0);
    expect(y1).toBeGreaterThan(y0);
  });
});
