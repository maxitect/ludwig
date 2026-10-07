import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "crossed-wires",
  title: "Crossed Wires",
  difficulty: 3,
  sourceNote: "Generated with the Fix the Diagram generator (seed crossed-wires, medium preset, K=1), chosen by the Ludwig authors and published unedited.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 5,
  mOut: 2,
  maxAdjustments: 1,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 0, initialOffset: 3, halfWidthDeg: 45, isDriver: false },
    { label: "B", teeth: 16, startSlot: 1, initialOffset: 12, halfWidthDeg: 45, isDriver: false },
    { label: "C", teeth: 8, startSlot: 10, initialOffset: 7, halfWidthDeg: 45, isDriver: false },
    { label: "D", teeth: 16, startSlot: 5, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
    { label: "E", teeth: 16, startSlot: 6, initialOffset: 11, halfWidthDeg: 45, isDriver: true },
    { label: "F", teeth: 16, startSlot: 7, initialOffset: 4, halfWidthDeg: 45, isDriver: false },
    { label: "G", teeth: 16, startSlot: 9, initialOffset: 10, halfWidthDeg: 45, isDriver: false },
    { label: "H", teeth: 8, startSlot: 4, initialOffset: 3, halfWidthDeg: 45, isDriver: false },
    { label: "I", teeth: 16, startSlot: 11, initialOffset: 14, halfWidthDeg: 45, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "I" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
  ],
  solution: {
    crank: 11,
    convergence: 4,
    killerLabel: "G",
    swaps: [{ a: "C", b: "H" }],
  },
} satisfies Content;
