import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type Board,
  collisions,
  meshes,
  type Placement,
  samePlacement,
  solve,
  trainOf,
  validate,
} from "./engine";
import {
  contradictory,
  planted,
  plantedSolution,
  triangle,
  triangleCogs,
} from "./fixture";

const cog = (row: number, col: number, teeth: 8 | 16 | 24) => ({
  row,
  col,
  teeth,
});

describe("geometry", () => {
  const empty: Board = {
    rows: 12,
    cols: 12,
    targetClockwise: true,
    driver: cog(10, 1, 8),
    target: cog(10, 10, 8),
    bolts: [],
    inventory: [{ teeth: 8, count: 1 }],
  };

  it("meshes two cogs on an axis when the pitch circles touch", () => {
    expect(meshes(cog(0, 0, 8), cog(0, 2, 8))).toBe(true);
    expect(meshes(cog(0, 0, 16), cog(3, 0, 8))).toBe(true);
  });

  it("meshes 16 and 24 on a 3-4-5 diagonal", () => {
    expect(meshes(cog(0, 0, 16), cog(3, 4, 24))).toBe(true);
    expect(meshes(cog(0, 0, 16), cog(4, 3, 24))).toBe(true);
    expect(meshes(cog(0, 0, 16), cog(3, 3, 24))).toBe(false);
  });

  it("collides one peg short of a mesh and not at a mesh", () => {
    const short = [cog(3, 3, 24), cog(3, 7, 16)];
    expect(collisions(empty, short)).toEqual([
      { kind: "cog", a: short[0], b: short[1] },
    ]);
    expect(collisions(empty, [cog(3, 3, 24), cog(3, 8, 16)])).toEqual([]);
  });

  it("collides a bolt on a cog's rim but not one peg outside it", () => {
    const rim = { ...empty, bolts: [{ row: 5, col: 7 }] };
    expect(collisions(rim, [cog(5, 5, 16)]).map((c) => c.kind)).toEqual([
      "bolt",
    ]);
    const outside = { ...empty, bolts: [{ row: 5, col: 8 }] };
    expect(collisions(outside, [cog(5, 5, 16)])).toEqual([]);
  });

  it("collides a disc that leaves the board", () => {
    expect(collisions(empty, [cog(1, 5, 16)])).toEqual([
      { kind: "board", cog: cog(1, 5, 16) },
    ]);
    expect(collisions(empty, [cog(2, 5, 16)])).toEqual([]);
  });
});

describe("trainOf", () => {
  it("gives alternating spin signs along a chain", () => {
    const train = trainOf(planted, plantedSolution);
    expect(train.signs).toMatchObject({ "3,1": 1, "5,1": -1, "5,3": 1 });
    expect(train.signs["3,7"]).toBe(-1);
    expect(train.jammed).toBe(false);
    expect(train.unreachable).toEqual([]);
  });

  it("reports a jam and an unreachable cog", () => {
    expect(trainOf(triangle, triangleCogs).jammed).toBe(true);
    expect(trainOf(planted, [cog(1, 7, 8)]).unreachable).toEqual([
      planted.target,
      cog(1, 7, 8),
    ]);
  });
});

describe("validate", () => {
  const open: Board = { ...planted, bolts: [] };
  const rule = (board: Board, placement: Placement) => {
    const verdict = validate(board, placement);
    return verdict.ok ? 0 : verdict.rule;
  };

  it("accepts the planted placement", () => {
    expect(validate(planted, plantedSolution)).toEqual({ ok: true });
  });

  it("names rule 1 for a cog on a bolt, a fixed cog or a taken peg", () => {
    expect(rule(planted, [cog(2, 3, 8)])).toBe(1);
    expect(rule(planted, [cog(3, 1, 8)])).toBe(1);
    expect(rule(planted, [cog(5, 1, 8), cog(5, 1, 8)])).toBe(1);
  });

  it("names rule 2 for more cogs of a size than the inventory holds", () => {
    expect(rule(planted, [...plantedSolution, cog(1, 1, 8)])).toBe(2);
    expect(rule(planted, [cog(5, 4, 16)])).toBe(2);
  });

  it("names rule 3 for a collision", () => {
    expect(rule(planted, [cog(3, 2, 8)])).toBe(3);
    expect(rule(planted, [cog(3, 3, 8)])).toBe(3);
  });

  it("names rule 4 for a cog the driver cannot reach", () => {
    expect(rule(planted, [cog(5, 5, 8)])).toBe(4);
  });

  it("names rule 5 for a jammed train", () => {
    expect(rule(triangle, triangleCogs)).toBe(5);
  });

  it("names rule 6 for the wrong target direction", () => {
    expect(rule(contradictory, plantedSolution)).toBe(6);
  });

  it("names rule 7 for an unneeded cog on a parallel branch", () => {
    const chain = [cog(3, 3, 8), cog(3, 5, 8)];
    expect(rule(open, chain)).toBe(0);
    expect(rule(open, [...chain, cog(5, 3, 8)])).toBe(7);
  });
});

describe("solve", () => {
  it("finds exactly the planted placement", () => {
    const found = solve(planted);
    expect(found).toHaveLength(1);
    expect(samePlacement(found[0], plantedSolution)).toBe(true);
  });

  it("finds two placements once a bolt is removed, and caps at two", () => {
    const [first] = planted.bolts;
    const found = solve({ ...planted, bolts: [first] });
    expect(found).toHaveLength(2);
    expect(solve({ ...planted, bolts: [] }, 2)).toHaveLength(2);
    expect(solve({ ...planted, bolts: [] }, 10).length).toBeGreaterThan(2);
  });

  it("finds none when the direction is contradictory", () => {
    expect(solve(contradictory)).toEqual([]);
  });

  it("agrees with validate on every placement of a small board", () => {
    const options = Array.from({ length: 5 * 7 }, (_, i) => i).flatMap((i) =>
      ([8, 16, 24] as const).map((teeth) =>
        cog(Math.floor(i / 7), i % 7, teeth),
      ),
    );
    for (const targetClockwise of [true, false]) {
      const board: Board = {
        rows: 5,
        cols: 7,
        targetClockwise,
        driver: cog(2, 1, 8),
        target: cog(2, 5, 8),
        bolts: [{ row: 1, col: 3 }],
        inventory: [
          { teeth: 8, count: 2 },
          { teeth: 16, count: 1 },
        ],
      };
      const valid: Placement[] = [];
      const grow = (start: number, current: Placement) => {
        if (validate(board, current).ok) valid.push([...current]);
        if (current.length === 3) return;
        for (let i = start; i < options.length; i++) {
          grow(i + 1, [...current, options[i]]);
        }
      };
      grow(0, []);
      const found = solve(board, 100);
      expect(found).toHaveLength(valid.length);
      for (const placement of valid) {
        expect(found.some((f) => samePlacement(f, placement))).toBe(true);
      }
    }
  });
});

describe("samePlacement", () => {
  it("ignores the order cogs were placed in", () => {
    expect(samePlacement([...plantedSolution].reverse(), plantedSolution)).toBe(
      true,
    );
    expect(
      samePlacement(
        [{ ...plantedSolution[0], teeth: 16 }],
        [plantedSolution[0]],
      ),
    ).toBe(false);
  });
});

describe("purity", () => {
  it("imports no React, Next or database code", () => {
    const source = readFileSync(`${__dirname}/engine.ts`, "utf8");
    const imports = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(imports.sort()).toEqual(["../_shared/spin-signs", "./schema"]);
  });
});
