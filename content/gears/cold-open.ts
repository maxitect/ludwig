import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "cold-open",
  title: "Cold Open",
  difficulty: 4,
  sourceNote: "Generated with the gear generator (seed cold-open, hard preset), chosen by the Ludwig authors and published unedited.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 7,
  mOut: 2,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 8, startSlot: 0, initialOffset: 7, halfWidthDeg: 30, isDriver: true },
    { label: "B", teeth: 16, startSlot: 1, initialOffset: 11, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 16, startSlot: 2, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 16, startSlot: 3, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 8, startSlot: 6, initialOffset: 3, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 7, initialOffset: 3, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 16, startSlot: 8, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
    { label: "H", teeth: 16, startSlot: 9, initialOffset: 9, halfWidthDeg: 30, isDriver: false },
    { label: "I", teeth: 16, startSlot: 11, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "H" },
    { a: "A", b: "I" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "E", b: "F" },
    { a: "F", b: "G" },
    { a: "G", b: "H" },
  ],
  solution: {
    crank: 8,
    convergence: 8,
    killerLabel: "I",
    swaps: [],
  },
} satisfies Content;
