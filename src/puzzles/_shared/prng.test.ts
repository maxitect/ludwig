import { describe, expect, it } from "vitest";
import { hashSeed, mulberry32 } from "./prng";

describe("prng", () => {
  it("mulberry32 repeats for the same seed and stays in [0, 1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("hashSeed is a stable uint32 that separates nearby seeds", () => {
    expect(hashSeed("2026-11-01")).toBe(hashSeed("2026-11-01"));
    expect(hashSeed("")).toBe(0x811c9dc5);
    const hashes = new Set(
      Array.from({ length: 10000 }, (_, i) => hashSeed(`s${i}`)),
    );
    expect(hashes.size).toBe(10000);
    for (const h of hashes) {
      expect(Number.isInteger(h) && h >= 0 && h < 2 ** 32).toBe(true);
    }
  });
});
