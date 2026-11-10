import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

/** Records the landing scroll as numbered frames: tsx scripts/dev/landing-strip.mts <baseUrl> <outDir> <from> <to> <step> */
const [base, out, from, to, step] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of [1280, 390]) {
  for (const theme of ["paper", "ink"]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 1280 ? 800 : 844 },
    });
    await page.goto(base);
    await page.locator(".title-sequence").waitFor();
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      return document.fonts.ready;
    }, theme);
    for (let p = Number(from); p <= Number(to) + 1e-9; p += Number(step)) {
      await page.evaluate(async (value) => {
        const track = document.querySelector<HTMLElement>(".seq-track")!;
        const span = track.offsetHeight - window.innerHeight;
        const top = track.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.ceil(top + value * span));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, p);
      await page.screenshot({
        path: `${out}/${theme}-${width}-${String(Math.round(p * 100)).padStart(3, "0")}.png`,
      });
    }
    await page.close();
  }
}
await browser.close();
