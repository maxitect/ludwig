import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "second-movement",
  title: "Second Movement",
  difficulty: 3,
  sourceNote: "Generated with the gear generator (seed second-movement, medium preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 5,
  mOut: 4,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 8, startSlot: 0, initialOffset: 4, halfWidthDeg: 45, isDriver: false },
    { label: "B", teeth: 16, startSlot: 1, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
    { label: "C", teeth: 16, startSlot: 4, initialOffset: 7, halfWidthDeg: 45, isDriver: true },
    { label: "D", teeth: 8, startSlot: 5, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
    { label: "E", teeth: 8, startSlot: 6, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
    { label: "F", teeth: 16, startSlot: 7, initialOffset: 8, halfWidthDeg: 45, isDriver: false },
    { label: "G", teeth: 8, startSlot: 9, initialOffset: 2, halfWidthDeg: 45, isDriver: false },
    { label: "H", teeth: 16, startSlot: 10, initialOffset: 15, halfWidthDeg: 45, isDriver: false },
    { label: "I", teeth: 8, startSlot: 11, initialOffset: 4, halfWidthDeg: 45, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "I" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "E", b: "G" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
  ],
  solution: {
    crank: 7,
    convergence: 3,
    killerLabel: "G",
    swaps: [],
  },
} satisfies Content;
