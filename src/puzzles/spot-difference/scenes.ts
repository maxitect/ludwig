import type { Scene } from "./schema";

/**
 * One entry per scene key. The prepared images are `public/spot-difference/<key>/original.webp`
 * and `altered.webp` (`scripts/dev/prepare-scene.ts`); `width` and `height` are their size in pixels.
 */
export const scenes: Readonly<Record<string, Scene>> = {
  "fixture-clandon": {
    width: 1600,
    height: 1068,
    credit: {
      artist: "John Preston Neale",
      work: "Views of the Seats of Noblemen and Gentlemen, Clandon House",
      year: 1824,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Clandon_House_1824_engraving.jpg",
  },
};

export const getScene = (key: string) =>
  Object.hasOwn(scenes, key) ? scenes[key] : undefined;

export const sceneImage = (key: string, version: "original" | "altered") =>
  `/spot-difference/${key}/${version}.webp`;
