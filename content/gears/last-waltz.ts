import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "last-waltz",
  title: "Last Waltz",
  difficulty: 4,
  sourceNote: "Generated with the Fix the Diagram generator (seed last-waltz, hard preset, K=2), chosen by the Ludwig authors and published unedited.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 6,
  mOut: 8,
  maxAdjustments: 2,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 1, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
    { label: "B", teeth: 8, startSlot: 2, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 16, startSlot: 3, initialOffset: 3, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 8, startSlot: 5, initialOffset: 0, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 16, startSlot: 4, initialOffset: 4, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 7, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 8, startSlot: 8, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
    { label: "H", teeth: 8, startSlot: 11, initialOffset: 4, halfWidthDeg: 30, isDriver: true },
    { label: "I", teeth: 16, startSlot: 10, initialOffset: 12, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "G" },
    { a: "F", b: "G" },
    { a: "G", b: "I" },
    { a: "H", b: "I" },
  ],
  solution: {
    crank: 5,
    convergence: 7,
    killerLabel: "C",
    swaps: [{ a: "D", b: "E" }, { a: "H", b: "I" }],
  },
} satisfies Content;
