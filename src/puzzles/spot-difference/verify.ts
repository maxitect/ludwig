import path from "node:path";
import { changedBlocks, clusterBlocks } from "./pixel-diff";
import { regionInScene, regionsOverlap } from "../_shared/regions";
import { getScene } from "./scenes";
import type { Content, Region } from "./schema";

const ASSET_ROOT = path.join(process.cwd(), "public", "spot-difference");

type Alpha = { data: Uint8Array; width: number; height: number };

const contains = (outer: Region, inner: Region) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

async function readAlpha(file: string): Promise<Alpha> {
  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { data: alpha, width: info.width, height: info.height };
}

/**
 * Every cluster of changed ink between the two scenes must lie inside one region, and every
 * region must hold a cluster. That proves the puzzle has exactly the listed differences.
 * Regions need a margin of at least one block around the edit, as clusters are block-aligned.
 */
export function verifyChanges(
  original: Alpha,
  altered: Alpha,
  regions: readonly Region[],
) {
  if (original.width !== altered.width || original.height !== altered.height) {
    throw new Error("the two scene images differ in size");
  }
  const { columns, rows, changed } = changedBlocks(
    original.data,
    altered.data,
    original.width,
    original.height,
  );
  const clusters = clusterBlocks(changed, columns, rows);
  for (const cluster of clusters) {
    if (!regions.some((region) => contains(region, cluster))) {
      throw new Error(
        `the scenes differ at x ${cluster.x}, y ${cluster.y} (${cluster.width}x${cluster.height}) outside every region`,
      );
    }
  }
  for (const [i, region] of regions.entries()) {
    if (!clusters.some((cluster) => contains(region, cluster))) {
      throw new Error(`difference ${i} contains no change`);
    }
  }
}

/** The scene is registered, the regions are separate and inside it, and the images differ exactly there. */
export async function verifyScene(
  { sceneKey, differences }: Content,
  assetRoot: string,
) {
  const scene = getScene(sceneKey);
  if (!scene) throw new Error(`unknown scene "${sceneKey}"`);
  for (const [i, region] of differences.entries()) {
    if (!regionInScene(region, scene)) {
      throw new Error(`difference ${i} lies outside the scene`);
    }
    for (const [j, other] of differences.entries()) {
      if (j > i && regionsOverlap(region, other)) {
        throw new Error(`differences ${i} and ${j} overlap`);
      }
    }
  }
  const [original, altered] = await Promise.all([
    readAlpha(path.join(assetRoot, sceneKey, "original.webp")),
    readAlpha(path.join(assetRoot, sceneKey, "altered.webp")),
  ]);
  if (original.width !== scene.width || original.height !== scene.height) {
    throw new Error(
      `the scene images are ${original.width}x${original.height}, the registry says ${scene.width}x${scene.height}`,
    );
  }
  verifyChanges(original, altered, differences);
}

export const verifySpotDifference = (content: Content) =>
  verifyScene(content, ASSET_ROOT);
