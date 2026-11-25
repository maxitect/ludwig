// Extra screenshots for T175 AC13: the crossword with each list open, Reverse Chess unwind mid-game, and the phone layouts.
// node scripts/dev/t175-shots.mjs [base] [out]
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3175";
const out = process.argv[3] ?? ".verification/T175/shots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });

for (const size of [
  { width: 1440, height: 800 },
  { width: 1280, height: 650 },
]) {
  for (const scheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: size, colorScheme: scheme });
    const page = await context.newPage();
    const tag = `${size.width}x${size.height}-${scheme === "light" ? "paper" : "ink"}`;

    await page.goto(`${base}/puzzles/crossword/stage-door`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/crossword-across-${tag}.png` });
    await page.locator("details[name=crossword-clues] > summary", { hasText: "down" }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/crossword-down-${tag}.png` });

    await page.goto(`${base}/puzzles/reverse-chess/the-long-walk`);
    await page.waitForTimeout(2500);
    const entries = [
      ["d4", "d2"],
      ["d5", "d7"],
      ["c4", "c2"],
    ];
    for (const [from, to] of entries) {
      const square = (name) => page.locator(`[role="group"][aria-label^="${name},"]`);
      const a = await square(from).boundingBox();
      const b = await square(to).boundingBox();
      if (!a || !b) continue;
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${out}/unwind-midgame-${tag}.png` });
    await context.close();
  }
}

for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, colorScheme: scheme });
  const page = await context.newPage();
  for (const [name, path] of [
    ["crossword", "/puzzles/crossword/stage-door"],
    ["gears", "/puzzles/gears/final-curtain"],
  ]) {
    await page.goto(`${base}${path}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${out}/${name}-390-${scheme === "light" ? "paper" : "ink"}.png` });
  }
  await context.close();
}
await browser.close();
console.log("SHOTS DONE");
