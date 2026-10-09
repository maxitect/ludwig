import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { themeColors } from "../../src/config/theme-colors";

const WORDMARK_PATH = readFileSync(
  "src/components/brand/wordmark.tsx",
  "utf8",
).match(/const PATH =\s*"([^"]+)"/)?.[1];
if (!WORDMARK_PATH) throw new Error("No PATH in wordmark.tsx");

const subpaths = WORDMARK_PATH.split(/(?=M)/);
const L = subpaths.slice(0, 3).join("");
const FULL_STOP = subpaths.at(-1);
const FULL_STOP_SHIFT = -217;
const CENTRE = { x: 34.8, y: -31.5 };

type Icon = { file: string; size: number; span: number };

/** "L." from the wordmark on Ink. `span` is the viewBox side in wordmark units; the maskable one keeps the glyphs inside the 80% safe zone, and the OS applies the mask, so no corners are baked in. */
const ICONS: Icon[] = [
  { file: "public/icons/icon-192.png", size: 192, span: 118 },
  { file: "public/icons/icon-512.png", size: 512, span: 118 },
  { file: "public/icons/icon-512-maskable.png", size: 512, span: 144 },
  { file: "src/app/apple-icon.png", size: 180, span: 118 },
];

function svg(size: number, span: number) {
  const half = span / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${CENTRE.x - half} ${CENTRE.y - half} ${span} ${span}"><rect x="${CENTRE.x - half}" y="${CENTRE.y - half}" width="${span}" height="${span}" fill="${themeColors.ink}"/><path fill="#C40C12" d="${L}"/><path fill="#C40C12" transform="translate(${FULL_STOP_SHIFT} 0)" d="${FULL_STOP}"/></svg>`;
}

async function main() {
  mkdirSync("public/icons", { recursive: true });
  writeFileSync("src/app/icon.svg", svg(32, 110));
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { file, size, span } of ICONS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<body style="margin:0;background:${themeColors.ink}">${svg(size, span)}</body>`,
    );
    writeFileSync(file, await page.screenshot({ type: "png" }));
    console.log(`${file} ${size}x${size}`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
