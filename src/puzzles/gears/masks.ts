/**
 * Bit-parallel form of the engine's `sees` rule, used by the generators to test
 * thousands of candidate diagrams quickly. Bit `u * 8 + (f - 1)` says whether a
 * gear sees the victim at convergence `f` when the driver has turned `u` teeth in
 * total (`u = crank + mIn + (f - 1) * (mIn - mOut)`, taken mod the lcm of the teeth).
 *
 * A gear's mask depends only on its teeth, spin sign and phase
 * `(initialOffset * slotCount - teeth * startSlot) mod (teeth * slotCount)`. Gears with equal
 * masks see at exactly the same moments, whatever their slots.
 */
export type Mask = Uint32Array;

type MaskShape = { slotCount: number; halfWidthDeg: number; cranks: number };

const FIGURES = 8;
const cache = new Map<string, Mask>();

const mod = (n: number, m: number) => ((n % m) + m) % m;

export const maskWords = (cranks: number) =>
  Math.ceil((cranks * FIGURES) / 32);

export function phaseOf(
  slotCount: number,
  teeth: number,
  startSlot: number,
  initialOffset: number,
) {
  return mod(initialOffset * slotCount - teeth * startSlot, teeth * slotCount);
}

export function seesMask(
  { slotCount, halfWidthDeg, cranks }: MaskShape,
  teeth: number,
  sign: 1 | -1,
  phase: number,
): Mask {
  const key = `${slotCount}:${halfWidthDeg}:${cranks}:${teeth}:${sign}:${phase}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const unitsPerTurn = teeth * slotCount;
  const advance = slotCount / 2 + 1;
  const mask = new Uint32Array(maskWords(cranks));
  for (let u = 0; u < cranks; u++) {
    for (let f = 1; f <= FIGURES; f++) {
      const gap = mod(
        phase +
          sign * u * slotCount -
          teeth * (f - 1) * advance -
          unitsPerTurn / 2,
        unitsPerTurn,
      );
      if (
        Math.min(gap, unitsPerTurn - gap) * 360 <=
        halfWidthDeg * unitsPerTurn
      ) {
        const bit = u * FIGURES + f - 1;
        mask[bit >> 5]! |= 1 << (bit & 31);
      }
    }
  }
  cache.set(key, mask);
  return mask;
}

export function popcount(v: number) {
  let x = v - ((v >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

/** Bits seen by exactly one of the given masks. */
export function loneBits(masks: readonly Mask[], words: number) {
  const ones = new Uint32Array(words);
  const twos = new Uint32Array(words);
  for (const mask of masks) {
    for (let w = 0; w < words; w++) {
      twos[w] = twos[w]! | (ones[w]! & mask[w]!);
      ones[w] = ones[w]! | mask[w]!;
    }
  }
  const lone = new Uint32Array(words);
  for (let w = 0; w < words; w++) lone[w] = ones[w]! & ~twos[w]!;
  return lone;
}

export function countBits(bits: Mask) {
  let n = 0;
  for (const word of bits) n += popcount(word);
  return n;
}

export function firstBit(bits: Mask) {
  for (let w = 0; w < bits.length; w++) {
    const word = bits[w]!;
    if (word !== 0) return w * 32 + (31 - Math.clz32(word & -word));
  }
  return -1;
}
