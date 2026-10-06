import type { Answer } from "./schema";

export type Swaps = Answer["swaps"];

export type PickResult = {
  swaps: Swaps;
  selectedId: string | null;
  notice: string | null;
};

const involves = ({ gearAId, gearBId }: Swaps[number], id: string) =>
  gearAId === id || gearBId === id;

export function partnerOf(swaps: Swaps, id: string) {
  const pair = swaps.find((swap) => involves(swap, id));
  if (!pair) return null;
  return pair.gearAId === id ? pair.gearBId : pair.gearAId;
}

export const undoSwapOf = (swaps: Swaps, id: string): Swaps =>
  swaps.filter((swap) => !involves(swap, id));

/**
 * One tap on a gear. A swap set is at most `max` pairwise-disjoint pairs, so a gear that is already
 * in a swap can only be tapped to undo it, by tapping its partner.
 */
export function pickGear(
  swaps: Swaps,
  selectedId: string | null,
  id: string,
  max: number,
  label: (id: string) => string,
): PickResult {
  if (selectedId === null) return { swaps, selectedId: id, notice: null };
  if (selectedId === id) return { swaps, selectedId: null, notice: null };
  if (partnerOf(swaps, selectedId) === id) {
    return { swaps: undoSwapOf(swaps, id), selectedId: null, notice: null };
  }
  if (swaps.length >= max) {
    const used =
      max === 1 ? "The adjustment is" : `All ${max} adjustments are`;
    return {
      swaps,
      selectedId: null,
      notice: `${used} used. Tap a swapped pair again to undo it first.`,
    };
  }
  const taken = [selectedId, id].find((gear) => partnerOf(swaps, gear));
  if (taken !== undefined) {
    return {
      swaps,
      selectedId: null,
      notice: `Gear ${label(taken)} is already swapped with gear ${label(partnerOf(swaps, taken)!)}. Undo that swap first.`,
    };
  }
  const [gearAId, gearBId] = [selectedId, id].sort();
  return {
    swaps: [...swaps, { gearAId: gearAId!, gearBId: gearBId! }],
    selectedId: null,
    notice: null,
  };
}
