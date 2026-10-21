import { regionInScene, regionsOverlap } from "../_shared/regions";
import { normaliseTitle } from "./engine";
import { getScene } from "./scenes";
import type { Content } from "./schema";

/** The scene is registered at the stated size, regions are inside it and apart, and every name is distinct. */
export function verifyDetectiveScene({
  sceneKey,
  width,
  height,
  items,
}: Content) {
  const scene = getScene(sceneKey);
  if (!scene) throw new Error(`unknown scene "${sceneKey}"`);
  if (scene.width !== width || scene.height !== height) {
    throw new Error(
      `the content says ${width}x${height}, the registry says ${scene.width}x${scene.height}`,
    );
  }
  const owner = new Map<string, number>();
  for (const [i, item] of items.entries()) {
    if (!regionInScene(item, scene)) {
      throw new Error(`item ${i} lies outside the scene`);
    }
    for (const [j, other] of items.entries()) {
      if (j > i && regionsOverlap(item, other)) {
        throw new Error(`items ${i} and ${j} overlap`);
      }
    }
    for (const name of [item.title, ...item.aliases]) {
      const key = normaliseTitle(name);
      if (!key) {
        throw new Error(`item ${i} has a name with no letters: "${name}"`);
      }
      if (owner.has(key)) {
        throw new Error(
          `"${name}" of item ${i} duplicates a name of item ${owner.get(key)} after normalising`,
        );
      }
      owner.set(key, i);
    }
  }
}
