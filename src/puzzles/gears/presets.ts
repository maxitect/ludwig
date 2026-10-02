/**
 * Difficulty presets for the gear generators. Tunable after the T037 playtest, but
 * `slotCount` must stay a multiple of 4 and `gears.max` must not exceed it.
 *
 * Fewer distinct teeth counts keep the crank period (lcm of the teeth) small, which makes
 * the covering step of the generator far easier; that is why easy and medium use 8 and 16 only.
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
    gears: { min: 9, max: 10 },
    halfWidthDeg: 30,
    slotCount: 12,
    teeth: [12, 24],
    mIn: { min: 1, max: 9 },
    mOut: { min: 1, max: 9 },
  },
  expert: {
    gears: { min: 11, max: 12 },
    halfWidthDeg: 30,
    slotCount: 12,
    teeth: [12, 24],
    mIn: { min: 1, max: 11 },
    mOut: { min: 1, max: 11 },
  },
} as const;

export type Difficulty = keyof typeof presets;

export const difficulties = Object.keys(presets) as Difficulty[];
