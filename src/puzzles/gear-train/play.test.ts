import { describe, expect, it } from "vitest";
import {
  contradictory,
  planted,
  plantedSolution,
  triangle,
  triangleCogs,
} from "./fixture";
import { jamCogs, pegName, refusal, statusLine, unneededCogs } from "./play";

describe("pegName", () => {
  it("names a peg by column letter and 1-based row", () => {
    expect(pegName({ row: 3, col: 2 })).toBe("C4");
    expect(pegName({ row: 0, col: 11 })).toBe("L1");
  });
});

describe("refusal", () => {
  const cog = (row: number, col: number, teeth: 8 | 16 | 24 = 8) => ({
    row,
    col,
    teeth,
  });

  it("refuses a peg that already has a cog", () => {
    expect(refusal(planted, [], cog(3, 1))).toBe("Peg B4 already has a cog.");
    expect(refusal(planted, plantedSolution, cog(5, 3))).toBe(
      "Peg D6 already has a cog.",
    );
  });

  it("refuses a bolt's peg", () => {
    expect(refusal(planted, [], cog(2, 3))).toBe("Peg D3 has a bolt.");
  });

  it("refuses a size the tray has run out of", () => {
    expect(refusal(planted, plantedSolution, cog(1, 1))).toBe(
      "No 8-tooth cogs are left in the tray.",
    );
    expect(refusal(planted, [], cog(1, 1, 16))).toBe(
      "No 16-tooth cogs are left in the tray.",
    );
  });

  it("refuses an overlap with the cog it names", () => {
    expect(refusal(planted, [], cog(3, 2))).toBe(
      "A 8-tooth cog at C4 would overlap the cog at B4.",
    );
  });

  it("refuses a cog that would sit on a bolt", () => {
    expect(refusal(planted, [], cog(2, 4))).toMatch(/would sit on the bolt at/);
  });

  it("refuses a disc that leaves the board", () => {
    expect(refusal(triangle, [], { row: 1, col: 1, teeth: 24 })).toBe(
      "A 24-tooth cog at B2 would hang off the board.",
    );
  });

  it("accepts a free peg that collides with nothing", () => {
    expect(refusal(planted, [], cog(5, 1))).toBeNull();
  });
});

describe("jamCogs", () => {
  it("is empty for a train that turns", () => {
    expect(jamCogs(planted, plantedSolution)).toEqual([]);
  });

  it("marks the three cogs of an odd cycle and not the target behind it", () => {
    const marked = jamCogs(triangle, triangleCogs).map(pegName).sort();
    expect(marked).toEqual(["D5", "G5", "G9"]);
  });
});

describe("unneededCogs", () => {
  it("is empty while the target is not reached", () => {
    expect(unneededCogs(planted, plantedSolution.slice(0, 2))).toEqual([]);
  });

  it("names every cog whose removal still leaves the target reached", () => {
    const bypass = { row: 3, col: 3, teeth: 8 as const };
    expect(
      unneededCogs(planted, [...plantedSolution, bypass]).map(pegName),
    ).toEqual(["B6", "D4"]);
  });

  it("is empty for the planted chain", () => {
    expect(unneededCogs(planted, plantedSolution)).toEqual([]);
  });
});

describe("statusLine", () => {
  it("says the driver does not reach the target yet", () => {
    expect(statusLine(planted, [])).toBe(
      "The driver doesn't reach the target yet. The target must turn anticlockwise.",
    );
  });

  it("reports the direction and prompts a check for the solution", () => {
    expect(statusLine(planted, plantedSolution)).toBe(
      "The target turns anticlockwise. Every cog is needed. Press Check.",
    );
  });

  it("reports a direction that is wrong", () => {
    expect(statusLine(contradictory, plantedSolution)).toBe(
      "The target turns anticlockwise, but it must turn clockwise.",
    );
  });

  it("names the unneeded cogs", () => {
    const bypass = { row: 3, col: 3, teeth: 8 as const };
    expect(statusLine(planted, [...plantedSolution, bypass])).toBe(
      "The target turns anticlockwise. Cogs at B6 and D4 aren't needed.",
    );
    expect(statusLine(planted, [...plantedSolution.slice(0, 3), bypass])).toBe(
      "The driver doesn't reach the target yet. The target must turn anticlockwise.",
    );
  });

  it("says the train is jammed", () => {
    expect(statusLine(triangle, triangleCogs)).toBe(
      "The train is jammed, so nothing turns.",
    );
  });
});
