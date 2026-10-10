import { mkdirSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const SHOTS = ".verification/T140";
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
] as const;

const ROOMS = [
  { wall: ".seq-wall-grid", from: 0.06, to: 0.26 },
  { wall: ".seq-wall-board", from: 0.41, to: 0.58 },
  { wall: ".seq-wall-mirror", from: 0.72, to: 0.86 },
] as const;

const SWAP_WINDOWS = [
  [0.3, 0.36],
  [0.62, 0.68],
  [0.85, 0.91],
] as const;

async function open(page: Page, viewport: (typeof VIEWPORTS)[number]) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.locator(".title-sequence").waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** Scrolls so the title-sequence track sits at `progress` of its length. */
async function seek(page: Page, progress: number) {
  await page.evaluate(async (value) => {
    const track = document.querySelector<HTMLElement>(".seq-track")!;
    const span = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.ceil(top + value * span));
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  }, progress);
}

function computed(page: Page, selector: string, property: string) {
  return page
    .locator(selector)
    .first()
    .evaluate(
      (element, name) => getComputedStyle(element).getPropertyValue(name),
      property,
    );
}

/** Computed `translate` in px; browsers drop a zero y component. */
async function translateOf(page: Page, selector: string) {
  const [x = 0, y = 0] = (await computed(page, selector, "translate"))
    .split(" ")
    .filter((part) => part !== "none")
    .map(parseFloat);
  return [x, y];
}

async function opacity(page: Page, selector: string) {
  return Number(await computed(page, selector, "opacity"));
}

function box(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { left, top, width, height };
  });
}

async function setTheme(page: Page, theme: "paper" | "ink") {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
}

test.describe("landing walls", () => {
  test("AC1 each room is unobstructed in its dwell window and left through a wall", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "firefox", "pixel comparisons run in Chromium");
    test.setTimeout(240_000);
    for (const viewport of VIEWPORTS) {
      await open(page, viewport);
      for (const { wall, from, to } of ROOMS) {
        for (let step = Math.round(from * 50); step <= Math.round(to * 50); step++) {
          const progress = step / 50;
          await seek(page, progress);
          const wallBox = await box(page, wall);
          const clip = {
            x: Math.max(0, wallBox.left + wallBox.width * 0.1),
            y: Math.max(0, wallBox.top + wallBox.height * 0.1),
            width: Math.min(viewport.width, wallBox.width * 0.8),
            height: Math.min(viewport.height, wallBox.height * 0.8),
          };
          clip.width = Math.min(clip.width, viewport.width - clip.x);
          clip.height = Math.min(clip.height, viewport.height - clip.y);
          const withSide = await page.screenshot({ clip });
          await page.locator(".seq-wall-left").evaluate((element) => {
            element.style.visibility = "hidden";
          });
          const without = await page.screenshot({ clip });
          await page.locator(".seq-wall-left").evaluate((element) => {
            element.style.visibility = "";
          });
          expect(
            withSide.equals(without),
            `${wall} at ${progress} in ${viewport.width}px`,
          ).toBe(true);
        }
      }

      for (const progress of [0.33, 0.65, 0.88]) {
        await seek(page, progress);
        const side = await box(page, ".seq-wall-left");
        const visible =
          Math.min(side.left + side.width, viewport.width) -
          Math.max(side.left, 0);
        expect(
          visible / viewport.width,
          `side wall width at ${progress} in ${viewport.width}px`,
        ).toBeGreaterThanOrEqual(0.7);
        await page.screenshot({
          path: `${SHOTS}/ac1-crossing-${viewport.width}-${Math.round(progress * 100)}.png`,
        });
      }

      const samples: Record<string, number[]> = {};
      for (const { wall } of ROOMS) samples[wall] = [];
      for (let step = 0; step <= 100; step++) {
        await seek(page, step / 100);
        for (const { wall } of ROOMS) {
          samples[wall].push(await opacity(page, wall));
        }
      }
      for (const [wall, values] of Object.entries(samples)) {
        values.slice(1).forEach((value, index) => {
          if (Math.abs(value - values[index]) < 0.02) return;
          const inWindow = SWAP_WINDOWS.some(
            ([lo, hi]) => index / 100 >= lo - 1e-9 && (index + 1) / 100 <= hi + 1e-9,
          );
          expect(inWindow, `${wall} opacity changes at ${index / 100}`).toBe(true);
        });
      }
    }
  });

  test("AC2 the game unwinds in cell units on the scroll timeline", async ({
    page,
    browserName,
  }) => {
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      await seek(page, 0.4);
      expect(await translateOf(page, ".seq-bpiece-queen")).toEqual([0, 0]);
      await seek(page, 0.58);
      expect(await translateOf(page, ".seq-bpiece-queen")).toEqual([0, -240]);
      await seek(page, 0.46);
      expect(await opacity(page, ".seq-bpiece-black-pawn")).toBe(0);
      await seek(page, 0.5);
      expect(await opacity(page, ".seq-bpiece-black-pawn")).toBe(1);
      if (browserName === "firefox") continue;
      for (const progress of [0.4, 0.46, 0.52, 0.58]) {
        await seek(page, progress);
        await page.screenshot({
          path: `${SHOTS}/ac2-${viewport.width}-${Math.round(progress * 100)}.png`,
        });
      }
    }
  });

  test("AC4 the Grid and the Mirror fill in", async ({ page, browserName }) => {
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      await seek(page, 0.12);
      expect(await computed(page, ".seq-grid-ludwig", "clip-path")).toContain("100%");
      await seek(page, 0.28);
      for (const word of [".seq-grid-ludwig", ".seq-grid-ink"]) {
        expect(await computed(page, word, "clip-path")).toMatch(
          /^inset\(0(px)?( 0(px)?)*\)$/,
        );
      }
      await seek(page, 0.71);
      const digits = page.locator(".seq-mirror-digit");
      expect(await digits.count()).toBe(5);
      for (const opacityValue of await digits.evaluateAll((all) =>
        all.map((element) => getComputedStyle(element).opacity),
      )) {
        expect(opacityValue).toBe("0");
      }
      await seek(page, 0.92);
      const shown = await digits.evaluateAll((all) =>
        all.map((element) => ({
          text: element.textContent,
          opacity: getComputedStyle(element).opacity,
          transform: `${getComputedStyle(element).scale}`,
        })),
      );
      expect(shown.map(({ text }) => text)).toEqual(["7", "1", "5", "9", "4"]);
      for (const { opacity: value, transform } of shown) {
        expect(value).toBe("1");
        expect(transform).toMatch(/^-1( 1)?$/);
      }
      if (browserName === "firefox") continue;
      for (const progress of [0.12, 0.2, 0.28, 0.71, 0.92]) {
        await seek(page, progress);
        await page.screenshot({
          path: `${SHOTS}/ac4-${viewport.width}-${Math.round(progress * 100)}.png`,
        });
      }
    }
  });

  test("AC5 the phone shows the whole sequence", async ({ page }) => {
    await open(page, VIEWPORTS[0]);
    for (const progress of [0.42, 0.5, 0.58]) {
      await seek(page, progress);
      const wall = await box(page, ".seq-wall-board");
      for (const selector of [
        ".seq-bpiece-queen",
        ".seq-bpiece-white-pawn",
        ".seq-bpiece-black-pawn",
      ]) {
        const piece = await box(page, selector);
        expect(piece.left, `${selector} left at ${progress}`).toBeGreaterThanOrEqual(wall.left);
        expect(piece.left + piece.width).toBeLessThanOrEqual(wall.left + wall.width);
        expect(piece.top).toBeGreaterThanOrEqual(wall.top);
        expect(piece.top + piece.height).toBeLessThanOrEqual(wall.top + wall.height);
      }
    }
    const far = page.locator(".seq-bpiece-far");
    expect(await far.count()).toBeGreaterThan(0);
    for (const display of await far.evaluateAll((all) =>
      all.map((element) => getComputedStyle(element).display),
    )) {
      expect(display).toBe("none");
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  });

  test("AC6 both themes render correctly", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", "screenshots are taken in Chromium");
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      const fills: string[] = [];
      for (const theme of ["paper", "ink"] as const) {
        await setTheme(page, theme);
        for (const progress of [0.2, 0.48, 0.85]) {
          await seek(page, progress);
          await page.screenshot({
            path: `${SHOTS}/ac6-${theme}-${viewport.width}-${Math.round(progress * 100)}.png`,
          });
        }
        expect(await computed(page, ".seq-grid-ludwig", "color")).toBe(
          await computed(page, ".seq-mirror-digit", "color"),
        );
        fills.push(
          await page
            .locator(".seq-bpiece-white-pawn svg")
            .evaluate((svg) => getComputedStyle(svg).getPropertyValue("--piece-fill")),
          await page
            .locator(".seq-bpiece-queen svg")
            .evaluate((svg) => getComputedStyle(svg).getPropertyValue("--piece-fill")),
        );
      }
      expect(fills[0]).toBe(fills[2]);
      expect(fills[1]).toBe(fills[3]);
      expect(fills[0]).not.toBe(fills[1]);
    }
  });

  test("AC7 the fallback path plays the same sequence", async ({ page, browserName }) => {
    test.skip(browserName !== "firefox", "the fallback project runs in Firefox");
    await open(page, VIEWPORTS[2]);
    expect(await page.evaluate(() => CSS.supports("animation-timeline: view()"))).toBe(false);
    await expect(page.locator(".title-sequence")).toHaveAttribute("data-seq-scroll", "");
    await seek(page, 0.5);
    const queen = await translateOf(page, ".seq-bpiece-queen");
    expect(Math.abs(queen[0])).toBeLessThanOrEqual(1);
    expect(Math.abs(queen[1] + 240)).toBeLessThanOrEqual(1);
    const progress = Number(
      await computed(page, ".title-sequence", "--seq-progress"),
    );
    const moved = Math.min(1, Math.max(0, (progress - 0.47) / 0.04)) * 80;
    const pawn = await translateOf(page, ".seq-bpiece-white-pawn");
    expect(Math.abs(pawn[0] - moved)).toBeLessThanOrEqual(1);
    expect(Math.abs(pawn[1] - moved)).toBeLessThanOrEqual(1);
  });

  test("AC8 reduced motion shows a static composition", async ({ page, browserName }) => {
    for (const mode of ["media", "attribute"] as const) {
      await page.emulateMedia({
        reducedMotion: mode === "media" ? "reduce" : "no-preference",
      });
      await open(page, VIEWPORTS[2]);
      if (mode === "attribute") {
        await page.evaluate(() => {
          document.documentElement.dataset.reduceMotion = "";
        });
      }
      expect(
        await page.evaluate(
          () => document.querySelector(".title-sequence")!.getAnimations({ subtree: true }).length,
        ),
      ).toBe(0);
      for (const word of [".seq-grid-ludwig", ".seq-grid-ink"]) {
        expect(await computed(page, word, "clip-path")).toBe("none");
      }
      expect(await page.locator(".seq-grid-ludwig").textContent()).toBe("LUDWIG");
      expect(await page.locator(".seq-grid-ink").textContent()).toBe("INK");
      if (browserName !== "firefox") {
        await page.screenshot({ path: `${SHOTS}/ac8-${mode}.png` });
      }
    }
  });

  test("AC9 scrubbing stays smooth on a throttled phone", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(browserName !== "chromium" || !isMobile, "the mobile project measures this");
    await open(page, VIEWPORTS[0]);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await seek(page, 0.34);
    await page.evaluate(() => {
      const deltas: number[] = [];
      let last = performance.now();
      const tick = (now: number) => {
        deltas.push(now - last);
        last = now;
        (window as unknown as { __deltas: number[] }).__deltas = deltas;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.waitForTimeout(500);
    const events: string[] = [];
    cdp.on("Tracing.dataCollected", ({ value }) => {
      for (const event of value) events.push(event.name);
    });
    const done = new Promise<void>((resolve) => cdp.once("Tracing.tracingComplete", () => resolve()));
    await cdp.send("Tracing.start", { categories: "devtools.timeline", transferMode: "ReportEvents" });
    const span = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>(".seq-track")!;
      return track.offsetHeight - window.innerHeight;
    });
    await page.mouse.move(195, 400);
    const total = span * 0.3;
    const stepSize = 20;
    for (let sent = 0; sent < total; sent += stepSize) {
      await page.mouse.wheel(0, stepSize);
      await page.waitForTimeout(16);
    }
    for (let sent = 0; sent < total; sent += stepSize) {
      await page.mouse.wheel(0, -stepSize);
      await page.waitForTimeout(16);
    }
    await cdp.send("Tracing.end");
    await done;
    const deltas = (await page.evaluate(
      () => (window as unknown as { __deltas: number[] }).__deltas,
    )).slice(2);
    const sorted = [...deltas].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const paints = events.filter((name) => name === "Paint").length;
    console.log(`scrub frames ${deltas.length} p95 ${p95.toFixed(1)}ms max ${sorted.at(-1)!.toFixed(1)}ms paints ${paints}`);
    expect(p95).toBeLessThanOrEqual(20);
    expect(sorted.at(-1)!).toBeLessThanOrEqual(50);
    expect(paints).toBeLessThanOrEqual(20);
  });

  test("AC10 server and client render the same with no layout shift", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", "layout-shift entries are Chromium only");
    const messages: string[] = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) messages.push(message.text());
    });
    page.on("pageerror", (error) => messages.push(error.message));
    await page.addInitScript(() => {
      (window as unknown as { __shift: number }).__shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __shift: number }).__shift += (entry as unknown as { value: number }).value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.locator(".title-sequence").waitFor();
    await page.waitForTimeout(1500);
    expect(messages.filter((text) => /hydrat|did not match/i.test(text))).toEqual([]);
    expect(messages).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBe(0);
  });
});
