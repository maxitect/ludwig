import type { Scene } from "./schema";

/**
 * One entry per scene key. The prepared images are `original.webp`, `altered.webp` and the shelf's `thumb.webp`
 * in `public/spot-difference/<key>/` (`scripts/dev/prepare-scene.ts`); `width` and `height` are the size in pixels
 * of the first two.
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
  "pembroke-college": {
    width: 1600,
    height: 1155,
    credit: {
      artist: "John Le Keux, after J. A. Bell",
      work: "Memorials of Cambridge, Pembroke College from the Street",
      year: 1842,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:LeKeux_-_Cambridge,_c1840_-_Pembroke_01,_from_the_Street_-_memorialsofcambr01wriguoft_0334.jpg",
  },
  "erthig-hall": {
    width: 1600,
    height: 1058,
    credit: {
      artist: "J. Westley, after J. P. Neale",
      work: "Views of the Seats of Noblemen and Gentlemen, Erthig",
      year: 1828,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Views_of_the_seats_of_noblemen_and_gentlemen,_in_England,_Wales,_Scotland,_and_Ireland_(1824)_(14591922417).jpg",
  },
  "bridge-of-sighs": {
    width: 1600,
    height: 1136,
    credit: {
      artist: "John Le Keux, after J. A. Bell",
      work: "Memorials of Cambridge, New Bridge, St John's College",
      year: 1842,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:LeKeux_-_Cambridge,_c1840_-_St_John's_03,_Bridge_of_Sighs_-_memorialsofcambr01wriguoft_0190.jpg",
  },
  "over-london": {
    width: 1600,
    height: 1286,
    credit: {
      artist: "Adolphe Pannemaker, after Gustave Doré",
      work: "London: A Pilgrimage, Over London by Rail",
      year: 1872,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:YCBA_London_a_Pilgrimage_06.jpg",
  },
  "march-to-finchley": {
    width: 1600,
    height: 1197,
    credit: {
      artist: "Luke Sullivan, after William Hogarth",
      work: "The March to Finchley",
      year: 1761,
    },
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:The_March_to_Finchley_(A_Representation_of_the_March_of_the_Guards_towards_Scotland_in_the_Year_1745)_MET_DP827181.jpg",
  },
};

export const getScene = (key: string) =>
  Object.hasOwn(scenes, key) ? scenes[key] : undefined;

export const sceneImage = (
  key: string,
  version: "original" | "altered" | "thumb",
) => `/spot-difference/${key}/${version}.webp`;
