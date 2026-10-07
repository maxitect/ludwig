import { describe, expect, it } from "vitest";
import { mulberry32 } from "../_shared/prng";
import { spinSigns } from "../_shared/spin-signs";
import { type Diagram, lcmTeeth, stateAt } from "./engine";
import { phaseOf, seesMask } from "./masks";

const mod = (n: number, m: number) => ((n % m) + m) % m;

function randomPair(rand: () => number): Diagram {
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const slotCount = pick([4, 8, 12, 16]);
  const gears = ["D", "G"].map((id, i) => {
    const teeth = pick([8, 12, 16, 24]);
    return {
      id,
      label: id,
      teeth,
      startSlot: Math.floor(rand() * slotCount),
      initialOffset: Math.floor(rand() * teeth),
      halfWidthDeg: pick([1, 30, 45, 90, 180]),
      isDriver: i === 0,
    };
  });
  const mIn = 1 + Math.floor(rand() * 11);
  return {
    slotCount,
    mIn,
    mOut: 1 + ((mIn + Math.floor(rand() * 10)) % 11),
    gears,
    meshes: [{ gearAId: "D", gearBId: "G" }],
  };
}

describe("seesMask", () => {
  it("matches the engine's sees rule bit for bit, both spin signs", () => {
    const rand = mulberry32(35);
    for (let i = 0; i < 200; i++) {
      const diagram = randomPair(rand);
      const { slotCount, mIn, mOut, gears, meshes } = diagram;
      const spin = spinSigns(gears, meshes, "D");
      if (!spin.ok) throw new Error(spin.error);
      const cranks = lcmTeeth(gears);
      const masks = gears.map((gear) =>
        seesMask(
          { slotCount, halfWidthDeg: gear.halfWidthDeg, cranks },
          gear.teeth,
          spin.signs[gear.id]!,
          phaseOf(slotCount, gear.teeth, gear.startSlot, gear.initialOffset),
        ),
      );
      for (let crank = 0; crank < cranks; crank++) {
        for (let f = 1; f <= 8; f++) {
          const state = stateAt(diagram, crank, f);
          const bit = mod(crank + mIn + (f - 1) * (mIn - mOut), cranks) * 8 + f - 1;
          gears.forEach((gear, g) => {
            const fromMask = (masks[g]![bit >> 5]! & (1 << (bit & 31))) !== 0;
            expect(fromMask).toBe(state[gear.id]!.sees);
          });
        }
      }
    }
  });
});
