import { beforeAll, describe, expect, it } from "vitest";
import { solveAll, spinSigns } from "./engine";
import {
  applySwaps,
  diagramOf,
  generateDiagram,
  generateFixVariant,
  repairsOf,
} from "./generate";
import { difficulties, presets } from "./presets";
import { contentSchema } from "./schema";

const DIAGRAMS = 10_000;
const difficultyOf = (i: number) => difficulties[i % difficulties.length]!;

let generated: ReturnType<typeof generateDiagram>[] = [];

beforeAll(() => {
  generated = Array.from({ length: DIAGRAMS }, (_, i) =>
    generateDiagram(`s${i}`, difficultyOf(i)),
  );
});

describe("generateDiagram", () => {
  it("AC1: is deterministic and varies with the seed", () => {
    const first = generateDiagram("2026-11-01", "medium");
    expect(generateDiagram("2026-11-01", "medium")).toEqual(first);
    expect(generateDiagram("2026-11-02", "medium")).not.toEqual(first);
  });

  it("AC2: every diagram has exactly the authored solution", () => {
    generated.forEach((content) => {
      const wins = solveAll(diagramOf(content));
      expect(wins).toHaveLength(1);
      expect(wins[0]).toEqual({
        crank: content.solution.crank,
        convergence: content.solution.convergence,
        killerId: content.solution.killerLabel,
      });
      expect(content.solution.swaps).toEqual([]);
    });
  });

  it("never answers with the untouched dial (crank 0)", () => {
    generated.forEach((content) => {
      expect(content.solution.crank).not.toBe(0);
    });
  });

  it("AC3: meshes are bipartite, connected, ring-plus-chords and singly driven", () => {
    generated.forEach((content) => {
      const diagram = diagramOf(content);
      const driver = diagram.gears.filter((g) => g.isDriver);
      expect(driver).toHaveLength(1);
      expect(
        spinSigns(diagram.gears, diagram.meshes, driver[0]!.id).ok,
      ).toBe(true);
      const slots = diagram.gears.map((g) => g.startSlot);
      expect(new Set(slots).size).toBe(slots.length);
      const slotOf = new Map(diagram.gears.map((g) => [g.id, g.startSlot]));
      const chords: [number, number][] = [];
      for (const { gearAId, gearBId } of diagram.meshes) {
        const a = slotOf.get(gearAId)!;
        const b = slotOf.get(gearBId)!;
        const gap = Math.abs(a - b);
        expect(gap % 2).toBe(1);
        if (gap !== 1 && gap !== diagram.slotCount - 1) {
          chords.push(a < b ? [a, b] : [b, a]);
        }
      }
      for (const [a, b] of chords) {
        for (const [c, d] of chords) {
          expect((a < c && c < b && b < d) || (c < a && a < d && d < b)).toBe(
            false,
          );
        }
      }
    });
  });

  it("AC4: difficulty presets are respected", () => {
    generated.forEach((content, i) => {
      const preset = presets[difficultyOf(i)];
      expect(content.gears.length).toBeGreaterThanOrEqual(preset.gears.min);
      expect(content.gears.length).toBeLessThanOrEqual(preset.gears.max);
      expect(content.slotCount).toBe(preset.slotCount);
      expect(content.slotCount % 4).toBe(0);
      for (const gear of content.gears) {
        expect(gear.halfWidthDeg).toBe(preset.halfWidthDeg);
        expect(preset.teeth as readonly number[]).toContain(gear.teeth);
      }
    });
  });

  it("AC7: output parses as content and records the seed", () => {
    generated.slice(0, 100).forEach((content, i) => {
      expect(contentSchema.parse(content)).toEqual(content);
      expect(content.generatorSeed).toBe(`s${i}`);
    });
  });
});

describe("generateFixVariant", () => {
  const variants = Array.from({ length: 500 }, (_, i) => ({
    K: (i % 2) + 1,
    content: generateFixVariant(`f${i}`, difficultyOf(i >> 1), (i % 2) + 1),
  }));

  it("AC5: has no solution and exactly one repair, which is the stored one", () => {
    for (const { K, content } of variants) {
      const variant = diagramOf(content);
      expect(solveAll(variant)).toHaveLength(0);
      const repairs = repairsOf(variant, K);
      expect(repairs).toHaveLength(1);
      const stored = content.solution.swaps.map(({ a, b }) => ({
        gearAId: a,
        gearBId: b,
      }));
      expect(repairs[0]).toEqual(stored);
      expect(stored).toHaveLength(K);
      expect(content.maxAdjustments).toBe(K);
      const fixed = solveAll(applySwaps(variant, stored));
      expect(fixed).toEqual([
        {
          crank: content.solution.crank,
          convergence: content.solution.convergence,
          killerId: content.solution.killerLabel,
        },
      ]);
      expect(contentSchema.parse(content)).toEqual(content);
    }
  });

  it("repairsOf agrees with the engine on every swap set", () => {
    variants.slice(0, 12).forEach(({ K, content }) => {
      const variant = diagramOf(content);
      const ids = variant.gears.map((g) => g.id);
      const pairs = ids.flatMap((a, i) =>
        ids.slice(i + 1).map((b) => ({ gearAId: a, gearBId: b })),
      );
      const disjoint = (x: (typeof pairs)[number], y: (typeof pairs)[number]) =>
        new Set([x.gearAId, x.gearBId, y.gearAId, y.gearBId]).size === 4;
      const sets = [
        ...pairs.map((p) => [p]),
        ...(K === 2
          ? pairs.flatMap((p, i) =>
              pairs.slice(i + 1).filter((q) => disjoint(p, q)).map((q) => [p, q]),
            )
          : []),
      ];
      const expected = sets.filter(
        (set) => solveAll(applySwaps(variant, set)).length === 1,
      );
      const sorted = (list: unknown[]) => list.map((x) => JSON.stringify(x)).sort();
      expect(sorted(repairsOf(variant, K))).toEqual(sorted(expected));
    });
  });
});

describe("generation time", () => {
  it("AC6: mean diagram under 20 ms, median K=2 Fix variant under 2 s", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) generateDiagram(`t${i}`, difficultyOf(i));
    const mean = (performance.now() - start) / 1000;
    const times = Array.from({ length: 50 }, (_, i) => {
      const t0 = performance.now();
      generateFixVariant(`t${i}`, difficultyOf(i), 2);
      return performance.now() - t0;
    }).sort((a, b) => a - b);
    console.info(
      `AC6 mean generateDiagram ${mean.toFixed(2)} ms, median Fix K=2 ${times[25]!.toFixed(1)} ms`,
    );
    expect(mean).toBeLessThan(20);
    expect(times[25]!).toBeLessThan(2000);
  });
});
