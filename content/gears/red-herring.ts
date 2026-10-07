import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "red-herring",
  title: "Red Herring",
  difficulty: 4,
  sourceNote: "Generated with the gear generator (seed red-herring, hard preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 5,
  mOut: 6,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 8, startSlot: 0, initialOffset: 2, halfWidthDeg: 30, isDriver: true },
    { label: "B", teeth: 16, startSlot: 2, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 8, startSlot: 3, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 8, startSlot: 4, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 8, startSlot: 5, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 8, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 8, startSlot: 9, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "H", teeth: 8, startSlot: 10, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "I", teeth: 8, startSlot: 11, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "C" },
    { a: "A", b: "I" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "F", b: "G" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
  ],
  solution: {
    crank: 9,
    convergence: 3,
    killerLabel: "A",
    swaps: [],
  },
} satisfies Content;
