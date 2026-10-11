import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { content as fixture } from "../../../content/spot-difference/fixture-clandon";
import { sceneImage, scenes } from "./scenes";
import type { Content } from "./schema";
import { verifyChanges, verifyScene, verifySpotDifference } from "./verify";

const WIDTH = 160;
const HEIGHT = 120;

const blank = () => ({
  data: new Uint8Array(WIDTH * HEIGHT),
  width: WIDTH,
  height: HEIGHT,
});

function paint(
  image: ReturnType<typeof blank>,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
  value = 255,
) {
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      image.data[row * WIDTH + column] = value;
    }
  }
}

describe("verifyChanges", () => {
  const region = { x: 16, y: 16, width: 48, height: 40 };

  it("accepts a change inside its region", () => {
    const altered = blank();
    paint(altered, { x: 24, y: 24, width: 24, height: 16 });
    expect(() => verifyChanges(blank(), altered, [region])).not.toThrow();
  });

  it("ignores single pixels that flip, as the lossy encoder makes them", () => {
    const altered = blank();
    for (let i = 0; i < altered.data.length; i += 97) altered.data[i] = 255;
    expect(() => verifyChanges(blank(), altered, [region])).toThrow(
      /contains no change/,
    );
  });

  it("rejects a change outside every region", () => {
    const altered = blank();
    paint(altered, { x: 24, y: 24, width: 24, height: 16 });
    paint(altered, { x: 96, y: 72, width: 24, height: 24 });
    expect(() => verifyChanges(blank(), altered, [region])).toThrow(
      /x 96, y 72.*outside every region/,
    );
  });

  it("rejects a change that spills out of its region", () => {
    const altered = blank();
    paint(altered, { x: 24, y: 24, width: 56, height: 16 });
    expect(() => verifyChanges(blank(), altered, [region])).toThrow(
      /outside every region/,
    );
  });

  it("rejects a region that holds no change", () => {
    const altered = blank();
    paint(altered, { x: 24, y: 24, width: 24, height: 16 });
    const empty = { x: 96, y: 72, width: 48, height: 40 };
    expect(() => verifyChanges(blank(), altered, [region, empty])).toThrow(
      /difference 1 contains no change/,
    );
  });

  it("rejects two scenes of different sizes", () => {
    expect(() =>
      verifyChanges(blank(), { ...blank(), height: HEIGHT - 8 }, [region]),
    ).toThrow(/differ in size/);
  });
});

describe("the fixture scene", () => {
  it("passes puzzles:verify", async () => {
    await expect(verifySpotDifference(fixture)).resolves.toBeUndefined();
  });

  it("keeps the registry size in step with the images", () => {
    expect(scenes[fixture.sceneKey]).toMatchObject({ width: 1600, height: 1068 });
  });
});

describe("a doctored fixture scene", () => {
  let root: string;
  const publicRoot = path.join(process.cwd(), "public");

  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "spot-difference-"));
    await mkdir(path.join(root, fixture.sceneKey));
    const original = path.join(publicRoot, sceneImage(fixture.sceneKey, "original"));
    const altered = path.join(publicRoot, sceneImage(fixture.sceneKey, "altered"));
    await sharp(original).toFile(path.join(root, fixture.sceneKey, "original.webp"));
    const blot = await sharp({
      create: { width: 120, height: 80, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();
    await sharp(altered)
      .composite([{ input: blot, left: 1200, top: 200 }])
      .webp({ quality: 1, alphaQuality: 15 })
      .toFile(path.join(root, fixture.sceneKey, "altered.webp"));
  });

  afterAll(() => rm(root, { recursive: true, force: true }));

  it("fails when an altered pixel lies outside every region", async () => {
    await expect(verifyScene(fixture, root)).rejects.toThrow(
      /x 1200, y 200.*outside every region/,
    );
  });

  it("fails when a region contains no change", async () => {
    const withEmptyRegion: Content = {
      ...fixture,
      differences: [
        ...fixture.differences,
        { x: 1000, y: 700, width: 100, height: 80 },
      ],
    };
    await expect(
      verifyScene(withEmptyRegion, path.join(publicRoot, "spot-difference")),
    ).rejects.toThrow(/difference 3 contains no change/);
  });
});

describe("the scene and regions", () => {
  const dir = path.join(process.cwd(), "public", "spot-difference");

  it("rejects an unregistered scene", async () => {
    await expect(
      verifyScene({ ...fixture, sceneKey: "nowhere" }, dir),
    ).rejects.toThrow(/unknown scene/);
  });

  it("rejects a region outside the scene", async () => {
    await expect(
      verifyScene(
        { ...fixture, differences: [{ x: 1590, y: 10, width: 20, height: 20 }] },
        dir,
      ),
    ).rejects.toThrow(/outside the scene/);
  });

  it("rejects overlapping regions", async () => {
    await expect(
      verifyScene(
        {
          ...fixture,
          differences: [
            { x: 10, y: 10, width: 50, height: 50 },
            { x: 40, y: 40, width: 50, height: 50 },
          ],
        },
        dir,
      ),
    ).rejects.toThrow(/overlap/);
  });
});
