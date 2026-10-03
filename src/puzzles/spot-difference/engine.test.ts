import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  engines,
  findDifferenceAt,
  generateScene,
  regionCentre,
} from "./engine";
import { sceneNodeSchema } from "./schema";

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

describe("generator versions", () => {
  it("has v1 as its only entry", () => {
    expect(Object.keys(engines)).toEqual(["1"]);
  });

  it("throws for an unknown version", () => {
    expect(() => generateScene(1902, 5, 2)).toThrow(
      "Unknown generator version: 2",
    );
    expect(() => generateScene(1902, 5, 0)).toThrow(
      "Unknown generator version: 0",
    );
  });
});

describe("v1 determinism", () => {
  it("gives an identical tree for the same seed and version", () => {
    expect(generateScene(1902, 6, 1)).toEqual(generateScene(1902, 6, 1));
  });

  it("gives a different tree for a different seed", () => {
    const a = generateScene(1902, 6, 1);
    const b = generateScene(1903, 6, 1);
    expect(b.original).not.toEqual(a.original);
  });

  it("matches the v1 snapshot for a fixed seed", () => {
    expect(generateScene(1902, 6, 1)).toMatchSnapshot();
  });

  it("builds trees the scene schema accepts", () => {
    const { original, altered } = generateScene(7, 15, 1);
    expect(sceneNodeSchema.parse(original)).toEqual(original);
    expect(sceneNodeSchema.parse(altered)).toEqual(altered);
  });

  it("differs between the two scenes", () => {
    const { original, altered } = generateScene(1902, 1, 1);
    expect(altered).not.toEqual(original);
  });
});

describe("v1 differences", () => {
  it("places exactly difference_count separate regions inside the scene, over 500 seeds", () => {
    for (let seed = 0; seed < 500; seed++) {
      const count = (seed % 15) + 1;
      const { differences, original, altered } = generateScene(seed, count, 1);
      expect(differences).toHaveLength(count);
      expect(differences.map(({ index }) => index)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
      expect(altered).not.toEqual(original);
      for (const [i, { region }] of differences.entries()) {
        expect(region.x).toBeGreaterThanOrEqual(0);
        expect(region.y).toBeGreaterThanOrEqual(0);
        expect(region.x + region.width).toBeLessThanOrEqual(SCENE_WIDTH);
        expect(region.y + region.height).toBeLessThanOrEqual(SCENE_HEIGHT);
        for (const other of differences.slice(i + 1)) {
          expect(overlap(region, other.region), `seed ${seed}`).toBe(false);
        }
      }
    }
  });

  it("uses every difference type across the seeds", () => {
    const types = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      for (const { type } of generateScene(seed, 10, 1).differences) {
        types.add(type);
      }
    }
    expect([...types].sort()).toEqual([
      "colour",
      "mirror",
      "move",
      "remove",
      "scale",
    ]);
  });

  it("hit-tests the centre of every region and nothing outside", () => {
    const { differences } = generateScene(1902, 6, 1);
    for (const difference of differences) {
      expect(findDifferenceAt(differences, regionCentre(difference.region))).toBe(
        difference,
      );
    }
    expect(findDifferenceAt(differences, { x: -1, y: -1 })).toBeNull();
  });

  it("keeps the engine free of colour literals", () => {
    const source = readFileSync(new URL("./engine.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/\b(rgb|hsl)a?\(/);
  });
});
