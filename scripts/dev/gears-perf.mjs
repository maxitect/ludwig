/**
 * T044 AC4/AC5: frame deltas, long tasks and LayoutCount on a gear board at 390x844 with a 4x CPU throttle.
 * Run against `pnpm start`: BASE=http://localhost:3044 [SLUG=final-curtain] [PLAY=key] node scripts/dev/gears-perf.mjs
 */
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3044";
const slug = process.env.SLUG ?? "final-curtain";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Performance.enable");
await page.goto(`${base}/puzzles/gears/${slug}`);
await page.getByRole("slider", { name: "Dance scrubber" }).waitFor();
await page.waitForTimeout(1500);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const instrument = () =>
  page.evaluate(() => {
    window.__frames = [];
    window.__long = [];
    let last = performance.now();
    const tick = (now) => {
      window.__frames.push(now - last);
      last = now;
      window.__raf = requestAnimationFrame(tick);
    };
    window.__raf = requestAnimationFrame(tick);
    window.__observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__long.push(entry.duration);
    });
    window.__observer.observe({ type: "longtask", buffered: false });
  });

const collect = () =>
  page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    window.__observer.disconnect();
    const frames = window.__frames.slice(1).sort((a, b) => a - b);
    const at = (p) => frames[Math.min(frames.length - 1, Math.floor(frames.length * p))];
    return {
      frames: frames.length,
      median: +at(0.5).toFixed(2),
      p95: +at(0.95).toFixed(2),
      max: +frames[frames.length - 1].toFixed(2),
      longTasks: window.__long.length,
      longestTask: Math.max(0, ...window.__long),
    };
  });

const layoutCount = async () =>
  (await cdp.send("Performance.getMetrics")).metrics.find((m) => m.name === "LayoutCount").value;

await instrument();
const keyboardPlay = process.env.PLAY === "key";
if (keyboardPlay) {
  await page.getByRole("slider", { name: "Dance scrubber" }).focus();
  await page.waitForTimeout(300);
}
const layoutStart = await layoutCount();
if (keyboardPlay) await page.keyboard.press(" ");
else await page.getByRole("button", { name: "Play dance" }).click();
await page.waitForTimeout(150);
const layoutAfterClick = await layoutCount();
await page.waitForTimeout(4850);
const layoutAfter = await layoutCount();
const dance = await collect();
await page.getByRole("button", { name: "Pause dance" }).click().catch(() => {});

await instrument();
const scrubber = page.getByRole("slider", { name: "Dance scrubber" });
await scrubber.focus();
await page.keyboard.press("Home");
const end = Date.now() + 5000;
let key = "ArrowRight";
while (Date.now() < end) {
  await page.keyboard.down(key);
  await page.waitForTimeout(30);
  const position = Number(await scrubber.getAttribute("aria-valuenow"));
  if (position >= 16) key = "ArrowLeft";
  if (position <= 0) key = "ArrowRight";
}
await page.keyboard.up(key);
const scrub = await collect();

console.log(JSON.stringify({ slug, dance, layoutCountDuringPress: layoutAfterClick - layoutStart, layoutCountAfterPress: layoutAfter - layoutAfterClick, layoutCountFromPress5s: layoutAfter - layoutStart, trigger: keyboardPlay ? "space" : "click", scrub }, null, 2));
await browser.close();
