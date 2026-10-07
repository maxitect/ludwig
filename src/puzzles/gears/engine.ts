import { type Signs, type Spin, spinSigns } from "../_shared/spin-signs";
import type { Payload, Solution } from "./schema";

export type Diagram = Pick<
  Payload,
  "slotCount" | "mIn" | "mOut" | "gears" | "meshes"
>;

type Gear = Diagram["gears"][number];

export type GearState = {
  slot: number;
  facingDeg: number;
  bearingDeg: number;
  sees: boolean;
};

export type Win = Pick<Solution, "crank" | "convergence"> & {
  killerId: Solution["killerGearId"];
};

const FIGURES = 8;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function lcmTeeth(gears: Gear[]) {
  return gears.reduce((l, g) => (l * g.teeth) / gcd(l, g.teeth), 1);
}

export function signsOf({ gears, meshes }: Diagram): Signs {
  const driver = gears.find((g) => g.isDriver);
  if (!driver) throw new Error("diagram has no driver gear");
  const result = spinSigns(gears, meshes, driver.id);
  if (!result.ok) throw new Error(result.error);
  return result.signs;
}

export function slotOf({ slotCount }: Diagram, gear: Gear, f: number) {
  return mod(gear.startSlot + (f - 1) * (slotCount / 2 + 1), slotCount);
}

function geometry(
  diagram: Diagram,
  gear: Gear,
  sign: Spin,
  crank: number,
  f: number,
) {
  const slot = slotOf(diagram, gear, f);
  const { mIn, mOut } = diagram;
  const facingTeeth = mod(
    gear.initialOffset + sign * (crank + mIn + (f - 1) * (mIn - mOut)),
    gear.teeth,
  );
  return { slot, facingTeeth };
}

/**
 * Exact in integers: facing and bearing are compared in units of
 * 360 / (teeth * slotCount) degrees, so the inclusive boundary never meets a float.
 */
function sees(diagram: Diagram, gear: Gear, slot: number, facingTeeth: number) {
  const unitsPerTurn = gear.teeth * diagram.slotCount;
  const bearing = slot * gear.teeth + unitsPerTurn / 2;
  const gap = mod(facingTeeth * diagram.slotCount - bearing, unitsPerTurn);
  return (
    Math.min(gap, unitsPerTurn - gap) * 360 <= gear.halfWidthDeg * unitsPerTurn
  );
}

function seers(diagram: Diagram, signs: Signs, crank: number, f: number) {
  let count = 0;
  let last = "";
  for (const gear of diagram.gears) {
    const { slot, facingTeeth } = geometry(
      diagram,
      gear,
      signs[gear.id]!,
      crank,
      f,
    );
    if (sees(diagram, gear, slot, facingTeeth)) {
      count++;
      last = gear.id;
    }
  }
  return { count, last };
}

export function stateAt(
  diagram: Diagram,
  crank: number,
  f: number,
): Record<string, GearState> {
  const signs = signsOf(diagram);
  return Object.fromEntries(
    diagram.gears.map((gear) => {
      const { slot, facingTeeth } = geometry(
        diagram,
        gear,
        signs[gear.id]!,
        crank,
        f,
      );
      const slotAngle = (slot * 360) / diagram.slotCount;
      const state: GearState = {
        slot,
        facingDeg: (facingTeeth * 360) / gear.teeth,
        bearingDeg: (slotAngle + 180) % 360,
        sees: sees(diagram, gear, slot, facingTeeth),
      };
      return [gear.id, state];
    }),
  );
}

export function seeingCount(diagram: Diagram, crank: number, f: number) {
  return seers(diagram, signsOf(diagram), crank, f).count;
}

/** Every (crank, convergence) over `[0, L) x 1..8` where exactly one gear sees the victim. */
export function solveAll(diagram: Diagram): Win[] {
  const signs = signsOf(diagram);
  const wins: Win[] = [];
  const cranks = lcmTeeth(diagram.gears);
  for (let crank = 0; crank < cranks; crank++) {
    for (let convergence = 1; convergence <= FIGURES; convergence++) {
      const { count, last } = seers(diagram, signs, crank, convergence);
      if (count === 1) wins.push({ crank, convergence, killerId: last });
    }
  }
  return wins;
}

/** Exchanges the starting slots of each pair; the pairs must be disjoint. */
export function applySwaps(diagram: Diagram, swaps: Solution["swaps"]): Diagram {
  const slots = new Map(diagram.gears.map((g) => [g.id, g.startSlot]));
  for (const { gearAId, gearBId } of swaps) {
    const a = slots.get(gearAId)!;
    slots.set(gearAId, slots.get(gearBId)!);
    slots.set(gearBId, a);
  }
  return {
    ...diagram,
    gears: diagram.gears.map((g) => ({ ...g, startSlot: slots.get(g.id)! })),
  };
}
