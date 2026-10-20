import type { Payload } from "./schema";

export const SIZE = 9;

/** A cell index is `row * 9 + col`; `digits[index]` is the number written there, or 0 for an empty cell. */
export type Layout = { digits: readonly number[] };

export function layoutOf({ numbers }: Payload): Layout {
  const digits = Array<number>(SIZE * SIZE).fill(0);
  for (const { row, col, digit } of numbers) digits[row * SIZE + col] = digit;
  return { digits };
}

export const cellOf = (index: number) => ({
  row: Math.floor(index / SIZE),
  col: index % SIZE,
});

export const boxOf = (index: number) =>
  Math.floor(index / 27) * 3 + Math.floor((index % 9) / 3);

/** The four lines a number covers: its digit, row, column and box, as indexes into 36 slots. */
const slotsOf = (index: number, digit: number) => [
  digit - 1,
  9 + Math.floor(index / SIZE),
  18 + (index % SIZE),
  27 + boxOf(index),
];

/**
 * Up to `limit` solutions, as exact cover: nine numbers that between them cover each digit, row, column and box
 * exactly once. Each step takes the uncovered slot with the fewest numbers still free to cover it, and stops at once
 * when a slot has none.
 */
export function solutions({ digits }: Layout, limit = Infinity): number[][] {
  const candidates: number[] = [];
  const bySlot = Array.from({ length: 36 }, () => [] as number[]);
  const slots = new Map<number, number[]>();
  digits.forEach((digit, index) => {
    if (!digit) return;
    candidates.push(index);
    const own = slotsOf(index, digit);
    slots.set(index, own);
    for (const slot of own) bySlot[slot].push(index);
  });
  const covered = Array<boolean>(36).fill(false);
  const chosen: number[] = [];
  const found: number[][] = [];

  const free = (index: number) => slots.get(index)!.every((s) => !covered[s]);
  const cover = (index: number, on: boolean) => {
    for (const slot of slots.get(index)!) covered[slot] = on;
  };

  const search = () => {
    if (found.length >= limit) return;
    if (chosen.length === SIZE) {
      found.push([...chosen].sort((a, b) => a - b));
      return;
    }
    let best: number[] | null = null;
    for (let slot = 0; slot < 36; slot++) {
      if (covered[slot]) continue;
      const open = bySlot[slot].filter(free);
      if (!best || open.length < best.length) best = open;
      if (open.length === 0) return;
    }
    for (const index of best!) {
      chosen.push(index);
      cover(index, true);
      search();
      cover(index, false);
      chosen.pop();
    }
  };

  search();
  return found;
}

/** How many solutions the layout has, counting no further than `limit`. */
export const countSolutions = (layout: Layout, limit = 2) =>
  solutions(layout, limit).length;

/** The first solution, or null when there is none. */
export const solve = (layout: Layout) => solutions(layout, 1)[0] ?? null;

/** The circled cells that share a digit, row, column or box with another circled cell. */
export function clashingIndexes(layout: Layout, circled: Iterable<number>) {
  const taken = new Map<number, number[]>();
  const all = [...new Set(circled)].filter((index) => layout.digits[index]);
  for (const index of all) {
    for (const slot of slotsOf(index, layout.digits[index])) {
      taken.set(slot, [...(taken.get(slot) ?? []), index]);
    }
  }
  return new Set(
    [...taken.values()].filter((group) => group.length > 1).flat(),
  );
}
