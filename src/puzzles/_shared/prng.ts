/** Deterministic PRNG: the same uint32 seed always yields the same sequence of floats in [0, 1). */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pure string to uint32 hash (FNV-1a over UTF-16 code units), so text seeds like '2026-11-01' can seed mulberry32. */
export function hashSeed(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}
