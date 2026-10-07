import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "pas-de-deux",
  title: "Pas de Deux",
  difficulty: 2,
  sourceNote: "Generated with the Fix the Diagram generator (seed pas-de-deux, easy preset, K=1), chosen by the Ludwig authors and published unedited.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 4,
  mOut: 1,
  maxAdjustments: 1,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 0, initialOffset: 10, halfWidthDeg: 45, isDriver: false },
    { label: "B", teeth: 8, startSlot: 7, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
    { label: "C", teeth: 8, startSlot: 3, initialOffset: 2, halfWidthDeg: 45, isDriver: false },
    { label: "D", teeth: 16, startSlot: 4, initialOffset: 15, halfWidthDeg: 45, isDriver: true },
    { label: "E", teeth: 16, startSlot: 6, initialOffset: 2, halfWidthDeg: 45, isDriver: false },
    { label: "F", teeth: 8, startSlot: 1, initialOffset: 2, halfWidthDeg: 45, isDriver: false },
    { label: "G", teeth: 8, startSlot: 9, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "C" },
    { a: "A", b: "G" },
    { a: "C", b: "D" },
    { a: "D", b: "F" },
    { a: "E", b: "F" },
  ],
  solution: {
    crank: 12,
    convergence: 6,
    killerLabel: "D",
    swaps: [{ a: "B", b: "F" }],
  },
} satisfies Content;
