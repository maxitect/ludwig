import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "opening-titles",
  title: "Opening Titles",
  difficulty: 2,
  sourceNote: "Generated with the gear generator (seed opening-titles, easy preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 2,
  mOut: 4,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 8, startSlot: 1, initialOffset: 6, halfWidthDeg: 45, isDriver: false },
    { label: "B", teeth: 8, startSlot: 2, initialOffset: 4, halfWidthDeg: 45, isDriver: true },
    { label: "C", teeth: 16, startSlot: 3, initialOffset: 1, halfWidthDeg: 45, isDriver: false },
    { label: "D", teeth: 8, startSlot: 7, initialOffset: 2, halfWidthDeg: 45, isDriver: false },
    { label: "E", teeth: 8, startSlot: 8, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
    { label: "F", teeth: 16, startSlot: 9, initialOffset: 9, halfWidthDeg: 45, isDriver: false },
    { label: "G", teeth: 8, startSlot: 11, initialOffset: 5, halfWidthDeg: 45, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "B", b: "C" },
    { a: "B", b: "G" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "E", b: "G" },
  ],
  solution: {
    crank: 14,
    convergence: 5,
    killerLabel: "G",
    swaps: [],
  },
} satisfies Content;
