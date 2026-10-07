import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "first-rehearsal",
  title: "First Rehearsal",
  difficulty: 2,
  sourceNote: "Generated with the gear generator (seed first-rehearsal, easy preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 1,
  mOut: 2,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 1, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
    { label: "B", teeth: 16, startSlot: 2, initialOffset: 1, halfWidthDeg: 45, isDriver: false },
    { label: "C", teeth: 16, startSlot: 3, initialOffset: 14, halfWidthDeg: 45, isDriver: false },
    { label: "D", teeth: 16, startSlot: 4, initialOffset: 4, halfWidthDeg: 45, isDriver: true },
    { label: "E", teeth: 16, startSlot: 7, initialOffset: 14, halfWidthDeg: 45, isDriver: false },
    { label: "F", teeth: 16, startSlot: 9, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
    { label: "G", teeth: 16, startSlot: 10, initialOffset: 12, halfWidthDeg: 45, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "G" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "E", b: "G" },
    { a: "F", b: "G" },
  ],
  solution: {
    crank: 4,
    convergence: 5,
    killerLabel: "B",
    swaps: [],
  },
} satisfies Content;
