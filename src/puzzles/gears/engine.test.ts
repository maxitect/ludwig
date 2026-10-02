import { describe, expect, it } from "vitest";
import {
  type Diagram,
  lcmTeeth,
  seeingCount,
  solveAll,
  spinSigns,
  stateAt,
} from "./engine";

type Gear = Diagram["gears"][number];

const gear = (
  id: string,
  teeth: number,
  startSlot: number,
  initialOffset = 0,
  isDriver = false,
  halfWidthDeg = 45,
): Gear => ({
  id,
  label: id,
  teeth,
  startSlot,
  initialOffset,
  halfWidthDeg,
  isDriver,
});

const mesh = (gearAId: string, gearBId: string) => ({ gearAId, gearBId });

const F3: Diagram = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  gears: [gear("A", 8, 0, 0, true), gear("B", 12, 1), gear("C", 16, 2)],
  meshes: [mesh("A", "B"), mesh("B", "C")],
};

const snapshot = (crank: number, f: number) =>
  Object.fromEntries(
    Object.entries(stateAt(F3, crank, f)).map(([id, s]) => [
      id,
      [s.facingDeg, s.slot, s.bearingDeg, s.sees],
    ]),
  );

describe("spinSigns and lcmTeeth", () => {
  it("AC1: signs by 2-colouring from the driver and lcm of teeth", () => {
    expect(spinSigns(F3.gears, F3.meshes, "A")).toEqual({
      ok: true,
      signs: { A: 1, B: -1, C: 1 },
    });
    expect(lcmTeeth(F3.gears)).toBe(48);
  });

  it("AC2: an odd cycle is rejected", () => {
    const result = spinSigns(F3.gears, [...F3.meshes, mesh("A", "C")], "A");
    expect(result).toEqual({ ok: false, error: "not_bipartite" });
  });
});

describe("stateAt", () => {
  it("AC3: convergence 1 at crank 4", () => {
    expect(snapshot(4, 1)).toEqual({
      A: [315, 0, 180, false],
      B: [150, 1, 225, false],
      C: [157.5, 2, 270, false],
    });
    expect(seeingCount(F3, 4, 1)).toBe(0);
  });

  it("AC4: convergence 2 at crank 4, boundary inclusive", () => {
    expect(snapshot(4, 2)).toEqual({
      A: [45, 4, 0, true],
      B: [90, 5, 45, true],
      C: [202.5, 6, 90, false],
    });
    expect(seeingCount(F3, 4, 2)).toBe(2);
  });

  it("AC5: convergences 3 to 5 at crank 4", () => {
    expect(snapshot(4, 3)).toMatchObject({
      A: [135, 0, 180, true],
      B: [30, 1, 225, false],
      C: [247.5, 2, 270, true],
    });
    expect(seeingCount(F3, 4, 3)).toBe(2);
    expect(seeingCount(F3, 4, 4)).toBe(0);
    expect(snapshot(4, 5)).toMatchObject({
      A: [315, 0, 180, false],
      B: [270, 1, 225, true],
      C: [337.5, 2, 270, false],
    });
    expect(seeingCount(F3, 4, 5)).toBe(1);
  });

  it("AC8: periodic in the crank with period lcm", () => {
    for (let c = 0; c < 48; c++) {
      for (let f = 1; f <= 8; f++) {
        expect(stateAt(F3, c, f)).toEqual(stateAt(F3, c + 48, f));
      }
    }
  });
});

describe("solveAll", () => {
  it("AC6: contains the known win and every entry has one seer", () => {
    const wins = solveAll(F3);
    expect(wins).toContainEqual({ crank: 4, convergence: 5, killerId: "B" });
    for (const win of wins) {
      expect(seeingCount(F3, win.crank, win.convergence)).toBe(1);
    }
  });
});

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Floating-point degrees, written from SPEC 5.2.2 without the engine. */
function naiveSolve(diagram: Diagram) {
  const { slotCount: S, mIn, mOut, gears, meshes } = diagram;
  const spin = new Map<string, number>();
  const driver = gears.find((g) => g.isDriver)!;
  spin.set(driver.id, 1);
  const queue = [driver.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const m of meshes) {
      const other =
        m.gearAId === current
          ? m.gearBId
          : m.gearBId === current
            ? m.gearAId
            : null;
      if (other !== null && !spin.has(other)) {
        spin.set(other, -spin.get(current)!);
        queue.push(other);
      }
    }
  }
  let L = 1;
  for (const g of gears) {
    let a = L;
    let b = g.teeth;
    while (b) [a, b] = [b, a % b];
    L = (L * g.teeth) / a;
  }
  const found: string[] = [];
  for (let c = 0; c < L; c++) {
    for (let f = 1; f <= 8; f++) {
      const seers: string[] = [];
      for (const g of gears) {
        const slot = (((g.startSlot + (f - 1) * (S / 2)) % S) + S) % S;
        const turned =
          g.initialOffset +
          spin.get(g.id)! * (c + mIn + (f - 1) * (mIn - mOut));
        const facing =
          ((((turned % g.teeth) + g.teeth) % g.teeth) * 360) / g.teeth;
        const bearing = (slot * (360 / S) + 180) % 360;
        const diff = Math.abs(facing - bearing) % 360;
        const distance = Math.min(diff, 360 - diff);
        if (distance <= g.halfWidthDeg) seers.push(g.id);
      }
      if (seers.length === 1) found.push(`${c}:${f}:${seers[0]}`);
    }
  }
  return found.sort();
}

const key = (w: { crank: number; convergence: number; killerId: string }) =>
  `${w.crank}:${w.convergence}:${w.killerId}`;

function randomDiagram(rand: () => number): Diagram {
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const slotCount = pick([4, 6, 8, 12]);
  const n = 3 + Math.floor(rand() * 6);
  const gears = Array.from({ length: n }, (_, i) => {
    const teeth = pick([8, 12, 16, 24]);
    return gear(
      `g${i}`,
      teeth,
      Math.floor(rand() * slotCount),
      Math.floor(rand() * teeth),
      i === 0,
      pick([30, 45]),
    );
  });
  const meshes = [];
  for (let i = 1; i < n; i++) {
    const parents = Array.from({ length: i }, (_, j) => j).filter(
      (j) => (i - j) % 2 === 1,
    );
    meshes.push(mesh(`g${pick(parents)}`, `g${i}`));
  }
  const mIn = 1 + Math.floor(rand() * 7);
  return {
    slotCount,
    mIn,
    mOut: mIn + 1 + Math.floor(rand() * 3),
    gears,
    meshes,
  };
}

describe("solveAll against a naive brute force", () => {
  it("AC7: agrees on F3", () => {
    expect(solveAll(F3).map(key).sort()).toEqual(naiveSolve(F3));
  });

  it("AC7: agrees on 200 seeded random diagrams", () => {
    const rand = mulberry32(34);
    for (let i = 0; i < 200; i++) {
      const diagram = randomDiagram(rand);
      expect(solveAll(diagram).map(key).sort()).toEqual(naiveSolve(diagram));
    }
  });
});

describe("performance", () => {
  it("AC9: 12 gears with L=48 solve in under 5 ms on average", () => {
    const teeth = [8, 12, 16, 24];
    const gears = Array.from({ length: 12 }, (_, i) =>
      gear(`g${i}`, teeth[i % 4]!, i % 8, i % 8, i === 0),
    );
    const meshes = Array.from({ length: 11 }, (_, i) =>
      mesh(`g${i}`, `g${i + 1}`),
    );
    const diagram: Diagram = { slotCount: 8, mIn: 3, mOut: 1, gears, meshes };
    expect(lcmTeeth(gears)).toBe(48);
    solveAll(diagram);
    const runs = 100;
    const start = performance.now();
    for (let i = 0; i < runs; i++) solveAll(diagram);
    expect((performance.now() - start) / runs).toBeLessThan(5);
  });
});
