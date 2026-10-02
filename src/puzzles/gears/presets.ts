/**
 * Difficulty presets for the gear generators. Tunable after the T037 playtest, but
 * `slotCount` must stay a multiple of 4 and `gears.max` must not exceed it.
 *
 * Constraints found while building the generator (see `generate.ts`):
 * - 8 and 16 teeth keep the crank period (lcm) at 16, which makes the covering step easy, and
 *   leave enough Fix the Diagram variants with a unique repair; 12 and 24 teeth did not.
 * - `slotCount` 12 is the sweet spot: at 8 or 16 slots no unique diagram appears below 8 gears.
 * - Gear counts are odd: the killer plus twin pairs. With 8 and 16 teeth and 12 slots a group of
 *   three twins cannot be placed, so an even count has no covering.
 * - Fewer than 7 gears at 45 degrees has no unique diagram under the sign and slot rules.
 */
export const presets = {
  easy: {
    gears: { min: 7, max: 7 },
    halfWidthDeg: 45,
    slotCount: 12,
    teeth: [8, 16],
    mIn: { min: 1, max: 5 },
    mOut: { min: 1, max: 5 },
  },
  medium: {
    gears: { min: 9, max: 9 },
    halfWidthDeg: 45,
    slotCount: 12,
    teeth: [8, 16],
    mIn: { min: 1, max: 7 },
    mOut: { min: 1, max: 7 },
  },
  hard: {
    gears: { min: 9, max: 9 },
    halfWidthDeg: 30,
    slotCount: 12,
    teeth: [8, 16],
    mIn: { min: 1, max: 9 },
    mOut: { min: 1, max: 9 },
  },
  expert: {
    gears: { min: 11, max: 11 },
    halfWidthDeg: 30,
    slotCount: 12,
    teeth: [8, 16],
    mIn: { min: 1, max: 11 },
    mOut: { min: 1, max: 11 },
  },
} as const;

export type Difficulty = keyof typeof presets;

export const difficulties = Object.keys(presets) as Difficulty[];
