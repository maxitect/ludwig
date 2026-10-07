import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "final-curtain",
  title: "Final Curtain",
  difficulty: 5,
  sourceNote: "Generated with the gear generator (seed final-curtain, expert preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 10,
  mOut: 5,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 0, initialOffset: 14, halfWidthDeg: 30, isDriver: true },
    { label: "B", teeth: 16, startSlot: 1, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 16, startSlot: 3, initialOffset: 11, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 16, startSlot: 4, initialOffset: 7, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 16, startSlot: 5, initialOffset: 15, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 6, initialOffset: 6, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 16, startSlot: 7, initialOffset: 9, halfWidthDeg: 30, isDriver: false },
    { label: "H", teeth: 16, startSlot: 8, initialOffset: 11, halfWidthDeg: 30, isDriver: false },
    { label: "I", teeth: 16, startSlot: 9, initialOffset: 3, halfWidthDeg: 30, isDriver: false },
    { label: "J", teeth: 16, startSlot: 10, initialOffset: 15, halfWidthDeg: 30, isDriver: false },
    { label: "K", teeth: 16, startSlot: 11, initialOffset: 7, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "K" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "F", b: "G" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
    { a: "I", b: "J" },
    { a: "J", b: "K" },
  ],
  solution: {
    crank: 4,
    convergence: 6,
    killerLabel: "H",
    swaps: [],
  },
} satisfies Content;
