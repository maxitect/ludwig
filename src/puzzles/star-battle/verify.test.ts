import { describe, expect, it } from "vitest";
import { content as doubleBill } from "../../../content/star-battle/double-bill";
import { content as firstLight } from "../../../content/star-battle/first-light";
import type { Content } from "./schema";
import { verifyStarBattle } from "./verify";

describe("verifyStarBattle", () => {
  it("accepts a unique puzzle at one star and at two stars", () => {
    expect(() => verifyStarBattle(firstLight)).not.toThrow();
    expect(() => verifyStarBattle(doubleBill)).not.toThrow();
  });

  it("rejects a grid with the wrong number of rows or cells", () => {
    expect(() =>
      verifyStarBattle({ ...firstLight, grid: firstLight.grid.slice(1) }),
    ).toThrow(/5 rows, not 6/);
    const ragged = [...firstLight.grid];
    ragged[2] = ragged[2].slice(1);
    expect(() => verifyStarBattle({ ...firstLight, grid: ragged })).toThrow(
      /row 3 has 5 cells, not 6/,
    );
  });

  it("rejects the wrong number of regions", () => {
    const merged = firstLight.grid.map((line) => line.replaceAll("5", "4"));
    expect(() => verifyStarBattle({ ...firstLight, grid: merged })).toThrow(
      /5 regions/,
    );
    const split: Content["grid"] = [...firstLight.grid];
    split[0] = split[0].replace("0", "6");
    expect(() => verifyStarBattle({ ...firstLight, grid: split })).toThrow(
      /7 regions/,
    );
  });

  it("rejects a region that is not edge-connected", () => {
    const split = ["010111", "223333", "223333", "444555", "444555", "444555"];
    expect(() => verifyStarBattle({ size: 6, stars: 1, grid: split })).toThrow(
      /not edge-connected/,
    );
  });

  it("rejects a puzzle with more than one solution", () => {
    const loose = Array.from({ length: 6 }, (_, i) => String(i).repeat(6));
    expect(() => verifyStarBattle({ size: 6, stars: 1, grid: loose })).toThrow(
      /more than one solution/,
    );
  });

  it("rejects a contradictory puzzle", () => {
    const single = [
      "011111",
      ...Array.from({ length: 5 }, (_, i) => String(i + 1).repeat(6)),
    ];
    expect(() =>
      verifyStarBattle({ size: 6, stars: 2, grid: single }),
    ).toThrow(/no solution/);
  });
});
