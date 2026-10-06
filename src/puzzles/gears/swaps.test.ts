import { describe, expect, it } from "vitest";
import { partnerOf, pickGear, undoSwapOf } from "./swaps";

const label = (id: string) => id.toUpperCase();
const pair = (gearAId: string, gearBId: string) => ({ gearAId, gearBId });

describe("pickGear", () => {
  it("selects a gear, then swaps it with the next one as an ordered pair", () => {
    expect(pickGear([], null, "c", 1, label)).toEqual({
      swaps: [],
      selectedId: "c",
      notice: null,
    });
    expect(pickGear([], "e", "c", 1, label)).toEqual({
      swaps: [pair("c", "e")],
      selectedId: null,
      notice: null,
    });
  });

  it("deselects when the selected gear is tapped again", () => {
    expect(pickGear([], "c", "c", 1, label).selectedId).toBeNull();
  });

  it("undoes a swap when its pair is tapped again, in either order", () => {
    const swaps = [pair("c", "e")];
    expect(pickGear(swaps, "c", "e", 1, label).swaps).toEqual([]);
    expect(pickGear(swaps, "e", "c", 1, label).swaps).toEqual([]);
  });

  it("blocks a further pair at the limit and explains why", () => {
    const swaps = [pair("c", "e")];
    const result = pickGear(swaps, "a", "b", 1, label);
    expect(result.swaps).toEqual(swaps);
    expect(result.notice).toMatch(/adjustment is used/);
  });

  it("keeps the pairs disjoint", () => {
    const swaps = [pair("c", "e")];
    const result = pickGear(swaps, "c", "a", 2, label);
    expect(result.swaps).toEqual(swaps);
    expect(result.notice).toBe(
      "Gear C is already swapped with gear E. Undo that swap first.",
    );
    expect(pickGear(swaps, "a", "b", 2, label).swaps).toHaveLength(2);
  });
});

describe("partnerOf and undoSwapOf", () => {
  const swaps = [pair("c", "e"), pair("a", "b")];

  it("finds the partner from either side", () => {
    expect(partnerOf(swaps, "c")).toBe("e");
    expect(partnerOf(swaps, "e")).toBe("c");
    expect(partnerOf(swaps, "d")).toBeNull();
  });

  it("removes the swap a gear is in", () => {
    expect(undoSwapOf(swaps, "e")).toEqual([pair("a", "b")]);
  });
});
