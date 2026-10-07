import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gears/schema";

export const meta = {
  slug: "the-long-take",
  title: "The Long Take",
  difficulty: 5,
  sourceNote: "Generated with the gear generator (seed the-long-take, expert preset), then curated by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  slotCount: 12,
  mIn: 6,
  mOut: 7,
  maxAdjustments: 0,
  occlusion: false,
  generatorSeed: null,
  gears: [
    { label: "A", teeth: 16, startSlot: 0, initialOffset: 0, halfWidthDeg: 30, isDriver: false },
    { label: "B", teeth: 8, startSlot: 1, initialOffset: 5, halfWidthDeg: 30, isDriver: false },
    { label: "C", teeth: 16, startSlot: 2, initialOffset: 4, halfWidthDeg: 30, isDriver: false },
    { label: "D", teeth: 8, startSlot: 3, initialOffset: 3, halfWidthDeg: 30, isDriver: false },
    { label: "E", teeth: 8, startSlot: 4, initialOffset: 7, halfWidthDeg: 30, isDriver: false },
    { label: "F", teeth: 16, startSlot: 5, initialOffset: 10, halfWidthDeg: 30, isDriver: false },
    { label: "G", teeth: 8, startSlot: 7, initialOffset: 1, halfWidthDeg: 30, isDriver: false },
    { label: "H", teeth: 16, startSlot: 8, initialOffset: 12, halfWidthDeg: 30, isDriver: false },
    { label: "I", teeth: 8, startSlot: 9, initialOffset: 7, halfWidthDeg: 30, isDriver: false },
    { label: "J", teeth: 8, startSlot: 10, initialOffset: 3, halfWidthDeg: 30, isDriver: true },
    { label: "K", teeth: 16, startSlot: 11, initialOffset: 2, halfWidthDeg: 30, isDriver: false },
  ],
  meshes: [
    { a: "A", b: "B" },
    { a: "A", b: "K" },
    { a: "B", b: "C" },
    { a: "C", b: "D" },
    { a: "D", b: "E" },
    { a: "E", b: "F" },
    { a: "G", b: "H" },
    { a: "H", b: "I" },
    { a: "I", b: "J" },
    { a: "J", b: "K" },
  ],
  solution: {
    crank: 7,
    convergence: 6,
    killerLabel: "A",
    swaps: [],
  },
} satisfies Content;
