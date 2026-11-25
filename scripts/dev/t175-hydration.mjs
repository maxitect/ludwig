// Compares the server-rendered solve page (JavaScript off) with the hydrated one at 1440x800: the sections' open
// state and the board's box must agree (T175 AC11). node scripts/dev/t175-hydration.mjs [base]
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3175";
const pages = [
  ["crossword", "stage-door", "[role=grid]"],
  ["rota", "canteen-queue", "[data-testid=rota-board]"],
  ["gears", "final-curtain", "[aria-label='Gear floor']"],
  ["gears", "crossed-wires", "[aria-label='Gear floor']"],
  ["logic-grid", "cold-frame", "[aria-label='Logic grid']"],
];

const snapshot = (page, boardSelector) =>
  page.evaluate((selector) => {
    const box = document.querySelector(selector)?.getBoundingClientRect();
    return {
      sections: [...document.querySelectorAll("details.panel-section")].map(
        (d) => `${d.querySelector("summary")?.textContent?.trim().slice(0, 18)}:${d.open}`,
      ),
      board: box ? [box.x, box.y, box.width, box.height].map(Math.round) : null,
    };
  }, boardSelector);

const browser = await chromium.launch();
let failures = 0;
for (const [type, slug, selector] of pages) {
  const shots = [];
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 800 }, javaScriptEnabled });
    const page = await context.newPage();
    await page.goto(`${base}/puzzles/${type}/${slug}`, { waitUntil: "load" });
    await page.waitForTimeout(javaScriptEnabled ? 2500 : 800);
    shots.push(await snapshot(page, selector));
    await context.close();
  }
  const [server, hydrated] = shots;
  const sameSections = JSON.stringify(server.sections) === JSON.stringify(hydrated.sections);
  const sameBoard =
    server.board && hydrated.board && server.board.every((v, i) => Math.abs(v - hydrated.board[i]) <= 1);
  if (!sameSections || !sameBoard) failures++;
  console.log(
    `${type}/${slug}: sections ${sameSections ? "same" : "DIFFER"} ${JSON.stringify(server.sections)} board ${sameBoard ? "same" : "DIFFER"} ${JSON.stringify(server.board)} vs ${JSON.stringify(hydrated.board)}`,
  );
}
console.log(failures ? `HYDRATION DIFFERENCES ${failures}` : "HYDRATION SAME");
await browser.close();
