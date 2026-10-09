import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { type Browser, chromium } from "@playwright/test";
import { Wordmark } from "../../src/components/brand/wordmark";
import { themeColors } from "../../src/config/theme-colors";

type Device = { width: number; height: number; ratio: number };

/** iPhone portrait sizes in CSS pixels; iOS picks the image whose media query matches exactly. */
export const DEVICES: Device[] = [
  { width: 440, height: 956, ratio: 3 },
  { width: 402, height: 874, ratio: 3 },
  { width: 430, height: 932, ratio: 3 },
  { width: 393, height: 852, ratio: 3 },
  { width: 428, height: 926, ratio: 3 },
  { width: 390, height: 844, ratio: 3 },
  { width: 375, height: 812, ratio: 3 },
  { width: 414, height: 896, ratio: 3 },
  { width: 414, height: 896, ratio: 2 },
  { width: 414, height: 736, ratio: 3 },
  { width: 375, height: 667, ratio: 2 },
];

const SCHEMES = {
  paper: { background: themeColors.paper, foreground: themeColors.ink, splat: "#C40C12", blend: "multiply", invert: 0 },
  ink: { background: themeColors.ink, foreground: themeColors.paper, splat: "#75171A", blend: "screen", invert: 1 },
} as const;

const GRAIN = `data:image/png;base64,${readFileSync("public/textures/grain.png").toString("base64")}`;

const wordmark = renderToStaticMarkup(
  createElement(Wordmark, { variant: "ink-splat", className: "w-full" }),
);

function page(scheme: keyof typeof SCHEMES, { width }: Device) {
  const { background, foreground, splat, blend, invert } = SCHEMES[scheme];
  return `<style>
    body{margin:0;width:100vw;height:100vh;display:grid;place-items:center;background:${background}}
    body::before{content:"";position:fixed;inset:0;background:url("${GRAIN}");background-size:512px 512px;mix-blend-mode:${blend};filter:invert(${invert});opacity:.35}
    .w-full{width:${Math.round(width * 0.8)}px;color:${foreground}}
    .relative{position:relative}.inline-block{display:inline-block}.block{display:block}.absolute{position:absolute}
    .p-8{padding:2rem}.left-4{left:1rem}.top-2{top:.5rem}.h-3\\/4{height:75%}.w-1\\/2{width:50%}.h-auto{height:auto}
    .text-ludwig-red,.ink\\:text-blood{color:${splat}}
    svg{overflow:visible}svg.w-full{width:100%}.text-foreground{color:${foreground}}
  </style>${wordmark}`;
}

/** Android draws its launch screen from the 512px manifest icon on `background_color` (Ink), so this one icon is the full wordmark on a transparent square. */
async function writeLaunchIcon(browser: Browser) {
  const { foreground, splat } = SCHEMES.ink;
  const tab = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await tab.setContent(
    page("ink", { width: 512, height: 512, ratio: 1 })
      .replace(/body\{[^}]*\}/, "body{margin:0;width:100vw;height:100vh;display:grid;place-items:center}")
      .replace(/body::before\{[^}]*\}/, "")
      .replace(`color:${foreground}}`, `color:${foreground}}`)
      .replace("</style>", `.w-full{width:${512 * 0.92}px}</style>`),
  );
  writeFileSync("public/icons/icon-512.png", await tab.screenshot({ type: "png", omitBackground: true }));
  await tab.close();
  console.log(`public/icons/icon-512.png (${splat})`);
}

async function main() {
  mkdirSync("public/splash", { recursive: true });
  const browser = await chromium.launch();
  await writeLaunchIcon(browser);
  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.ratio,
    });
    const tab = await context.newPage();
    for (const scheme of Object.keys(SCHEMES) as (keyof typeof SCHEMES)[]) {
      await tab.setContent(page(scheme, device));
      await tab.waitForLoadState("load");
      const file = `public/splash/${scheme}-${device.width}x${device.height}@${device.ratio}.jpg`;
      writeFileSync(file, await tab.screenshot({ type: "jpeg", quality: 88 }));
      console.log(file);
    }
    await context.close();
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
