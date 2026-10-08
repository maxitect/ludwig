import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { themeColors } from "../../src/config/theme-colors";

const L_GLYPH = readFileSync("src/app/icon.svg", "utf8").match(/<path[^>]*\/>/)?.[0];
if (!L_GLYPH) throw new Error("No <path> in src/app/icon.svg");

type Icon = { file: string; size: number; scale: number };

/** The L from src/app/icon.svg on paper. Maskable keeps the glyph inside the 80% safe zone; the OS applies the mask, so no corners are baked in. */
const ICONS: Icon[] = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1.3 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1.3 },
  { file: "public/icons/icon-512-maskable.png", size: 512, scale: 1 },
  { file: "src/app/apple-icon.png", size: 180, scale: 1.3 },
];

function svg({ size, scale }: Icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" fill="${themeColors.paper}"/><g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${L_GLYPH}</g></svg>`;
}

async function main() {
  mkdirSync("public/icons", { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const icon of ICONS) {
    await page.setViewportSize({ width: icon.size, height: icon.size });
    await page.setContent(
      `<body style="margin:0;background:${themeColors.paper}">${svg(icon)}</body>`,
    );
    writeFileSync(icon.file, await page.screenshot({ type: "png" }));
    console.log(`${icon.file} ${icon.size}x${icon.size}`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
