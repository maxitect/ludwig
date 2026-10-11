import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const LONG_EDGE = 1600;
const PAPER_LEVEL = 215;
const INK_LEVEL = 75;
const ALPHA_QUALITY = 15;

/**
 * Fixed levels, never a per-image normalise: the original and the altered copy must map the
 * same grey to the same alpha, or the pixel diff in `verify.ts` would see changes that aren't there.
 */
function alphaOf(grey: number) {
  const ink = (PAPER_LEVEL - grey) / (PAPER_LEVEL - INK_LEVEL);
  return Math.round(255 * Math.min(1, Math.max(0, ink)));
}

async function prepare(input: string, output: string) {
  const { data, info } = await sharp(input)
    .greyscale()
    .resize({
      width: LONG_EDGE,
      height: LONG_EDGE,
      fit: "inside",
      kernel: "lanczos3",
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < data.length; i++) pixels[i * 4 + 3] = alphaOf(data[i]);
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 1, alphaQuality: ALPHA_QUALITY, effort: 6 })
    .toFile(output);
  return { width: info.width, height: info.height };
}

async function main() {
  const [key, original, altered] = process.argv.slice(2);
  if (!key || !original || !altered) {
    throw new Error(
      "usage: tsx scripts/dev/prepare-scene.ts <key> <original> <altered>",
    );
  }
  const [a, b] = await Promise.all([
    sharp(original).metadata(),
    sharp(altered).metadata(),
  ]);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `the inputs differ in size: ${a.width}x${a.height} against ${b.width}x${b.height}`,
    );
  }
  const directory = path.join("public", "spot-difference", key);
  mkdirSync(directory, { recursive: true });
  const first = await prepare(original, path.join(directory, "original.webp"));
  const second = await prepare(altered, path.join(directory, "altered.webp"));
  if (first.width !== second.width || first.height !== second.height) {
    throw new Error("the prepared images differ in size");
  }
  console.log(`${key}: width ${first.width}, height ${first.height}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
