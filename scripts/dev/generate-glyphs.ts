import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pictogramGlyphs } from "../../content/lookups";

const heads = {
  circle: `<circle cx="24" cy="12" r="7.5"/>`,
  disc: `<circle cx="24" cy="12" r="7.5" fill="#000"/>`,
  square: `<rect x="16.5" y="4.5" width="15" height="15"/>`,
  triangle: `<polygon points="24,3.5 32.5,19.5 15.5,19.5"/>`,
  diamond: `<polygon points="24,3 32.5,12 24,21 15.5,12"/>`,
  eye: `<path d="M12 12 Q24 2 36 12 Q24 22 12 12 Z"/><circle cx="24" cy="12" r="4" fill="#000"/>`,
};

const body = `<path d="M24 21.5 V42"/>`;

const poses = {
  stand: `${body}<path d="M24 27 L12 39 M24 27 L36 39 M24 42 L15 60 M24 42 L33 60"/>`,
  cheer: `${body}<path d="M24 27 L10 15 M24 27 L38 15 M24 42 L15 60 M24 42 L33 60"/>`,
  wave: `${body}<path d="M24 27 L9 16 M24 27 L36 39 M24 42 L19 60 M24 42 L29 60"/>`,
  walk: `${body}<path d="M24 28 L8 28 M24 28 L40 28 M24 42 L16 60 M24 42 L31 51 L31 60"/>`,
  hips: `${body}<path d="M24 27 L11 34 L19 42 M24 27 L37 34 L29 42 M24 42 L18 60 M24 42 L30 60"/>`,
};

const bodyHeads = ["circle", "disc", "square", "triangle", "diamond"] as const;
const poseNames = Object.keys(poses) as (keyof typeof poses)[];

const designs = bodyHeads.flatMap((head) =>
  poseNames.map((pose) => ({ head, pose })),
);

const svg = (head: string, pose: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter">${head}${pose}</svg>\n`;

const outDir = path.join(process.cwd(), "public/glyphs");
mkdirSync(outDir, { recursive: true });

let next = 0;
for (const { assetKey, letter } of pictogramGlyphs) {
  const markup =
    letter === "e"
      ? svg(heads.eye, poses.stand)
      : svg(
          heads[designs[next].head],
          poses[designs[next++].pose],
        );
  writeFileSync(path.join(outDir, `${assetKey}.svg`), markup);
}
console.log(`wrote ${pictogramGlyphs.length} glyphs to ${outDir}`);
