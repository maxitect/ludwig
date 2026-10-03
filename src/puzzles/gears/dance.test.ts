import { describe, expect, it } from "vitest";
import { convergenceAt, danceAt, markerOf } from "./dance";
import { type Diagram, stateAt } from "./engine";
import { diagramOf, generateDiagram } from "./generate";
import { difficulties } from "./presets";

type Gear = Diagram["gears"][number];

const gear = (
  id: string,
  teeth: number,
  startSlot: number,
  isDriver = false,
): Gear => ({
  id,
  label: id,
  teeth,
  startSlot,
  initialOffset: 0,
  halfWidthDeg: 45,
  isDriver,
});

const F3: Diagram = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  gears: [gear("A", 8, 0, true), gear("B", 12, 1), gear("C", 16, 2)],
  meshes: [
    { gearAId: "A", gearBId: "B" },
    { gearAId: "B", gearBId: "C" },
  ],
};

const seatOf = (d: ReturnType<typeof danceAt>[string]) =>
  d.progress < 0.5 ? d.fromSlot : d.toSlot;

describe("danceAt", () => {
  it("equals stateAt exactly at every convergence marker", () => {
    const diagrams = [
      F3,
      ...difficulties.flatMap((difficulty) =>
        ["a", "b", "c"].map((seed) =>
          diagramOf(generateDiagram(`dance-${seed}`, difficulty)),
        ),
      ),
    ];
    for (const diagram of diagrams) {
      for (const crank of [0, 1, 7, 13]) {
        for (let f = 1; f <= 8; f++) {
          const dance = danceAt(diagram, crank, markerOf(f));
          const state = stateAt(diagram, crank, f);
          for (const { id } of diagram.gears) {
            expect(dance[id]!.facingDeg).toBe(state[id]!.facingDeg);
            expect(seatOf(dance[id]!)).toBe(state[id]!.slot);
            expect(dance[id]!.toInner || dance[id]!.fromInner).toBe(true);
          }
        }
      }
    }
  });

  it("moves gear A one slot round and across the floor each figure", () => {
    expect(seatOf(danceAt(F3, 4, 1).A!)).toBe(0);
    expect(seatOf(danceAt(F3, 4, 3).A!)).toBe(5);
    expect(seatOf(danceAt(F3, 4, 5).A!)).toBe(2);
  });

  it("turns in by +m_in teeth and out by -m_out teeth", () => {
    const facing = (position: number) => danceAt(F3, 0, position).A!.facingDeg;
    expect(facing(1) - facing(0)).toBe(135);
    expect(facing(2) - facing(1)).toBe(-45);
    expect(facing(3) - facing(2)).toBe(135);
  });

  it("travels in to the inner ring, then out to the next slot's outer ring", () => {
    const start = danceAt(F3, 0, 0).A!;
    expect([start.fromInner, start.toInner, start.progress]).toEqual([
      false,
      true,
      0,
    ]);
    const out = danceAt(F3, 0, 1.5).A!;
    expect([out.fromSlot, out.toSlot, out.fromInner, out.toInner]).toEqual([
      0, 5, true, false,
    ]);
    expect(out.progress).toBe(0.5);
    const end = danceAt(F3, 0, 16).A!;
    expect([end.toInner, end.progress]).toEqual([false, 1]);
  });

  it("recognises convergence positions", () => {
    expect(convergenceAt(1)).toBe(1);
    expect(convergenceAt(15)).toBe(8);
    expect([convergenceAt(0), convergenceAt(2), convergenceAt(2.5)]).toEqual([
      null,
      null,
      null,
    ]);
  });
});
