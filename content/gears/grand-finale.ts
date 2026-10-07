import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "grand-finale",
  title: "Grand Finale",
  difficulty: 5,
  sourceNote: "Generated with the gear generator (seed grand-finale, expert preset), chosen by the Ludwig authors and published unedited.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 4,
  mOut: 5,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 0, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
    { label: "B", teeth: 8, startSlot: 1, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 8, startSlot: 2, initialOffset: 6, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 8, startSlot: 3, initialOffset: 6, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 8, startSlot: 4, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 5, initialOffset: 14, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 16, startSlot: 6, initialOffset: 2, halfWidthDeg: 30, isDriver: true },
    { label: "H", teeth: 8, startSlot: 7, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "I", teeth: 8, startSlot: 8, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
    { label: "J", teeth: 8, startSlot: 10, initialOffset: 6, halfWidthDeg: 30, isDriver: false },
    { label: "K", teeth: 16, startSlot: 11, initialOffset: 6, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "K" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "F", b: "G" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
    { a: "J", b: "K" },
  ],
  solution: {
    crank: 9,
    convergence: 6,
    killerLabel: "D",
    swaps: [],
  },
} satisfies Content;
