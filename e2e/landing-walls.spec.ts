import { mkdirSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/** CPU benchmark time on the dev machine. The GitHub runner is ~5x slower and software-rasterises, so scrub frames land on 30fps boundaries there whatever the throttle; a runner that slow is allowed one dropped vsync. */
const REFERENCE_BENCH_MS = 96;
const SHOTS = ".verification/T167";
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
  { wall: ".seq-wall-finale", from: 0.96, to: 1 },
] as const;

const PANS = [
  { from: 0.26, to: 0.41 },
  { from: 0.58, to: 0.72 },
  { from: 0.86, to: 0.96 },
] as const;

/** Room pitch is 70% of the stage width, so the divider sits half a pitch from the camera at a dwell. */
const PITCH = 0.7;

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

/** Camera lateral position (px along the room row) from the world's `transform`, and yaw (deg) from its `rotate`. */
function readCamera(page: Page) {
  return page.locator(".seq-world").evaluate((world) => {
    const style = getComputedStyle(world);
    return {
      x: style.transform === "none" ? 0 : -new DOMMatrix(style.transform).m41,
      yaw: style.rotate === "none" ? 0 : parseFloat(style.rotate.split(" ").at(-1)!),
    };
  });
}

/** `readCamera` at each step, scrubbed in one round trip so slow runners stay inside the timeout. */
async function sampleCamera(page: Page, steps: number[]) {
  return page.evaluate(async (list) => {
    const track = document.querySelector<HTMLElement>(".seq-track")!;
    const world = document.querySelector(".seq-world")!;
    const span = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const out: { progress: number; x: number; yaw: number }[] = [];
    for (const progress of list) {
      window.scrollTo(0, Math.ceil(top + progress * span));
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const style = getComputedStyle(world);
      out.push({
        progress,
        x: style.transform === "none" ? 0 : -new DOMMatrix(style.transform).m41,
        yaw: style.rotate === "none" ? 0 : parseFloat(style.rotate.split(" ").at(-1)!),
      });
    }
    return out;
  }, steps);
}

const everyHundredth = Array.from({ length: 101 }, (_, step) => step / 100);

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
  test("AC1 every room is staged side by side and painted from the start", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await open(page, viewport);
      await seek(page, 0);
      const lefts: number[] = [];
      for (const { wall } of ROOMS) {
        expect(await page.locator(wall).count(), `${wall} in the DOM`).toBe(1);
        expect(await computed(page, wall, "opacity"), `${wall} opacity`).toBe("1");
        expect(await computed(page, wall, "visibility"), `${wall} visibility`).toBe("visible");
        expect(await computed(page, wall, "display"), `${wall} display`).not.toBe("none");
        const rect = await box(page, wall);
        expect(rect.width, `${wall} width`).toBeGreaterThan(0);
        expect(rect.height, `${wall} height`).toBeGreaterThan(0);
        lefts.push(rect.left);
      }
      expect([...lefts].sort((a, b) => a - b), `rooms left to right in ${viewport.width}px`).toEqual(lefts);
      expect(await page.locator(".seq-wall-right").count(), "a wall after each room").toBe(4);
      expect(await page.locator(".seq-bpiece").count()).toBeGreaterThan(10);
      expect(await page.locator(".seq-wall-mirror .seq-mirror-digit").count()).toBe(5);
    }
  });

  test("AC1 the next room is already in its start state before each pan and does not change during it", async ({ page }) => {
    const snapshot = (selector: string) =>
      page.locator(selector).evaluate((room) =>
        [room, ...room.querySelectorAll("*")]
          .map((element) => {
            const style = getComputedStyle(element);
            return [
              element.tagName,
              element.className,
              element.childElementCount,
              style.opacity,
              style.translate,
              style.clipPath,
              style.display,
              style.visibility,
            ].join("|");
          })
          .join("\n"),
      );
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      for (const [wall, before, after] of [
        [".seq-wall-board", 0.26, 0.4],
        [".seq-wall-mirror", 0.58, 0.71],
        [".seq-wall-finale", 0.86, 0.96],
      ] as const) {
        await seek(page, 0);
        const start = await snapshot(wall);
        await seek(page, before);
        expect(await snapshot(wall), `${wall} at pan start`).toBe(start);
        await seek(page, (before + after) / 2);
        expect(await snapshot(wall), `${wall} mid-pan`).toBe(start);
        await seek(page, after);
        expect(await snapshot(wall), `${wall} at pan end`).toBe(start);
      }
    }
  });

  test("AC2 AC3 the camera path is continuous and each pan crosses a wall into the next room", async ({ page }) => {
    test.setTimeout(120_000);
    for (const viewport of VIEWPORTS) {
      await open(page, viewport);
      const width = (await box(page, ".seq-stage")).width;
      const pitch = PITCH * width;
      const samples = await sampleCamera(page, everyHundredth);
      const at = (progress: number) => samples[Math.round(progress * 100)];
      const calm = at(0.1).yaw;
      expect(calm).toBeGreaterThan(0);

      samples.slice(1).forEach((sample, index) => {
        const previous = samples[index];
        expect(
          sample.x - previous.x,
          `camera never moves back at ${sample.progress} in ${viewport.width}px`,
        ).toBeGreaterThanOrEqual(-0.5);
        expect(
          sample.x - previous.x,
          `no jump in position at ${sample.progress} in ${viewport.width}px`,
        ).toBeLessThanOrEqual(pitch / 3);
        expect(
          Math.abs(sample.yaw - previous.yaw),
          `no jump in yaw at ${sample.progress} in ${viewport.width}px`,
        ).toBeLessThanOrEqual(6);
      });

      const settled = samples.findIndex(({ progress }) => progress >= ROOMS[0].from);
      samples.slice(settled + 2).forEach((sample, index) => {
        const [before, previous] = [samples[settled + index], samples[settled + index + 1]];
        expect(
          Math.abs(sample.x - 2 * previous.x + before.x),
          `no lurch in travel at ${sample.progress} in ${viewport.width}px`,
        ).toBeLessThanOrEqual(pitch * 0.06);
        expect(
          Math.abs(sample.yaw - 2 * previous.yaw + before.yaw),
          `no snap in yaw at ${sample.progress} in ${viewport.width}px`,
        ).toBeLessThanOrEqual(2);
      });

      [[0.06, 0.26, 0], [0.41, 0.58, 1], [0.72, 0.86, 2], [0.96, 1, 3]].forEach(([from, to, room]) => {
        for (let step = Math.round(from * 100); step <= Math.round(to * 100); step++) {
          const sample = samples[step];
          expect(sample.x, `centred in room ${room} at ${sample.progress}`).toBeCloseTo(room * pitch, 0);
          expect(sample.yaw, `calm in room ${room} at ${sample.progress}`).toBeCloseTo(calm, 1);
        }
      });

      for (const [index, { from, to }] of PANS.entries()) {
        const wallX = (index + 0.5) * pitch;
        const inside = samples.filter(({ progress }) => progress >= from - 1e-9 && progress <= to + 1e-9);
        const crossing = inside.findIndex(({ x }) => x > wallX);
        expect(crossing, `pan ${index + 1} passes the wall plane`).toBeGreaterThan(0);
        expect(inside[0].x).toBeLessThan(wallX);
        expect(inside.at(-1)!.x).toBeGreaterThan(wallX);
        for (const sample of inside) {
          expect(sample.yaw, `never turns back toward the crossed wall at ${sample.progress}`).toBeGreaterThanOrEqual(calm - 0.1);
          expect(sample.yaw, `leads only slightly toward the next room at ${sample.progress}`).toBeLessThanOrEqual(calm + 6.1);
        }
        const before = inside[crossing - 1].progress;
        await seek(page, before);
        const opening = await page.evaluate(
          ({ divider, wall }) => {
            const edge = document.querySelectorAll(".seq-wall-right")[divider].getBoundingClientRect().right;
            const next = document.querySelector(wall)!.getBoundingClientRect();
            return Math.min(next.right, window.innerWidth) - Math.max(next.left, edge, 0);
          },
          { divider: index, wall: ROOMS[index + 1].wall },
        );
        expect(
          opening,
          `room ${index + 2} shows past the divider before the camera passes it (pan ${index + 1}, ${before}, ${viewport.width}px)`,
        ).toBeGreaterThanOrEqual(viewport.width * 0.05);
      }
    }
  });

  test("AC1 each room is unobstructed in its dwell window", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", "screenshots are taken in Chromium");
    test.setTimeout(240_000);
    for (const viewport of VIEWPORTS) {
      await open(page, viewport);
      for (const { wall, from, to } of ROOMS.slice(0, 3)) {
        for (let step = Math.round(from * 50); step <= Math.round(to * 50); step += 2) {
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
          await page.locator(".seq-wall-right").evaluateAll((all) => {
            for (const element of all) (element as HTMLElement).style.visibility = "hidden";
          });
          const without = await page.screenshot({ clip });
          await page.locator(".seq-wall-right").evaluateAll((all) => {
            for (const element of all) (element as HTMLElement).style.visibility = "";
          });
          expect(withSide.equals(without), `${wall} at ${progress} in ${viewport.width}px`).toBe(true);
        }
      }
    }
  });

  test("T156 AC1 LUDWIG writes with nothing in front of it", async ({ page, browserName }) => {
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      for (let step = 7; step <= 13; step++) {
        const progress = step / 50;
        await seek(page, progress);
        expect(await computed(page, ".seq-hero", "visibility"), `hero at ${progress}`).toBe("hidden");
        if (browserName === "firefox") continue;
        const column = await box(page, ".seq-grid-ludwig");
        const x = Math.max(0, column.left);
        const y = Math.max(0, column.top);
        const clip = {
          x,
          y,
          width: Math.min(column.width, viewport.width - x),
          height: Math.min(column.height, viewport.height - y),
        };
        const withHero = await page.screenshot({ clip });
        await page.locator(".seq-hero").evaluate((element) => {
          element.style.display = "none";
        });
        const without = await page.screenshot({ clip });
        await page.locator(".seq-hero").evaluate((element) => {
          element.style.display = "";
        });
        expect(withHero.equals(without), `LUDWIG column at ${progress} in ${viewport.width}px`).toBe(true);
      }
      await seek(page, 0.265);
      expect(await computed(page, ".seq-grid-ludwig", "clip-path")).toMatch(/^inset\(0(px)?( 0(px)?)*\)$/);
      expect(await page.locator(".seq-grid-ludwig > span").count()).toBe(6);
      if (browserName !== "firefox") {
        await page.screenshot({ path: `${SHOTS}/ac1-ludwig-${viewport.width}.png` });
      }
    }
  });

  test("T156 AC3 the toppled pieces carry the piece shadow and no block", async ({ page, browserName }) => {
    await open(page, VIEWPORTS[2]);
    expect(await page.locator(".seq-cast").count()).toBe(0);
    const filters = await page
      .locator(".seq-piece svg")
      .evaluateAll((all) => all.map((svg) => getComputedStyle(svg).filter));
    expect(filters.length).toBeGreaterThanOrEqual(3);
    for (const filter of filters) expect(filter.match(/drop-shadow/g)).toHaveLength(8);
    if (browserName === "firefox") return;
    for (const viewport of [VIEWPORTS[2], VIEWPORTS[0]]) {
      await open(page, viewport);
      for (const theme of ["paper", "ink"] as const) {
        await setTheme(page, theme);
        await seek(page, 0);
        await page.screenshot({ path: `${SHOTS}/ac3-${theme}-${viewport.width}-0.png` });
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
      await seek(page, 0.31);
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
      await seek(page, 0.86);
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
      for (const progress of [0.12, 0.2, 0.31, 0.71, 0.86]) {
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

  test("AC6 the fallback timing puts the camera where the view timeline does", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", "Firefox runs the real fallback in AC7");
    await open(page, VIEWPORTS[2]);
    const wanted = [0.14, 0.31, 0.5];
    const reference = await sampleCamera(page, wanted);
    const fractions: number[] = [];
    for (const progress of wanted) {
      await seek(page, progress);
      fractions.push(
        await page.evaluate(
          () => document.querySelector(".seq-world")!.getAnimations()[0].effect!.getComputedTiming().progress!,
        ),
      );
    }
    const forced = await page.context().newPage();
    await forced.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent =
        ".title-sequence * { animation-timeline: auto !important; animation-duration: 1s !important; animation-play-state: paused !important; animation-delay: calc(var(--seq-progress, 0) * -1s) !important; animation-range: normal !important; }";
      new MutationObserver((_, observer) => {
        if (!document.head) return;
        document.head.append(style);
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await forced.setViewportSize(VIEWPORTS[2]);
    await forced.goto("/");
    await forced.locator(".title-sequence").waitFor();
    for (const [index, progress] of wanted.entries()) {
      await forced.evaluate((value) => {
        document.querySelector<HTMLElement>(".title-sequence")!.style.setProperty("--seq-progress", String(value));
      }, fractions[index]);
      await expect
        .poll(async () => {
          const camera = await readCamera(forced);
          return Math.abs(camera.x - reference[index].x);
        }, { message: `camera x at ${progress}` })
        .toBeLessThanOrEqual(1);
      expect(
        Math.abs((await readCamera(forced)).yaw - reference[index].yaw),
        `camera yaw at ${progress}`,
      ).toBeLessThanOrEqual(0.1);
    }
  });

  test("AC8 reduced motion shows a static composition", async ({ page, browserName }) => {
    for (const mode of ["media", "attribute"] as const) {
      await page.emulateMedia({
        reducedMotion: mode === "media" ? "reduce" : "no-preference",
      });
      await open(page, VIEWPORTS[2]);
      if (mode === "attribute") {
        await expect(
          page.getByRole("button", { name: "Theme" }),
        ).toHaveAttribute("aria-haspopup", "menu");
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
        await expect
          .poll(() => computed(page, word, "clip-path"))
          .toBe("none");
      }
      expect(await page.locator(".seq-grid-ludwig").textContent()).toBe("LUDWIG");
      expect(await page.locator(".seq-grid-ink").textContent()).toBe("INK");
      if (browserName !== "firefox") {
        await page.screenshot({ path: `${SHOTS}/ac8-${mode}.png` });
      }
    }
  });

  /** Frame pacing is only meaningful with no other test competing for the CPU, so it runs alone in mobile-perf. */
  test("AC9 scrubbing stays smooth on a throttled phone", { tag: "@perf" }, async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(browserName !== "chromium" || !isMobile, "the mobile-perf project measures this");
    await open(page, VIEWPORTS[0]);
    const cdp = await page.context().newCDPSession(page);
    const benchMs = await page.evaluate(() => {
      const runs = Array.from({ length: 5 }, () => {
        const start = performance.now();
        let sink = 0;
        for (let i = 0; i < 2e8; i++) sink += Math.sqrt(i);
        return performance.now() - start + sink * 0;
      });
      return runs.sort((a, b) => a - b)[2];
    });
    const slowRunner = benchMs > 2 * REFERENCE_BENCH_MS;
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
    console.log(`bench ${benchMs.toFixed(0)}ms scrub frames ${deltas.length} p95 ${p95.toFixed(1)}ms max ${sorted.at(-1)!.toFixed(1)}ms paints ${paints}`);
    expect(p95).toBeLessThanOrEqual(slowRunner ? 34 : 20);
    expect(sorted.at(-1)!).toBeLessThanOrEqual(slowRunner ? 70 : 50);
    expect(paints).toBeLessThanOrEqual(20);
  });

  test.describe("with the service worker registering", () => {
    test.use({ serviceWorkers: "allow" });

    test("AC10 server and client render the same with no layout shift", async ({ page, browserName }) => {
      test.skip(browserName === "firefox", "layout-shift entries are Chromium only");
      const messages: string[] = [];
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) messages.push(message.text());
      });
      page.on("pageerror", (error) => messages.push(error.message));
      await page.addInitScript(() => {
        const record = window as unknown as { __shift: number; __shifted: string[] };
        record.__shift = 0;
        record.__shifted = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as unknown as {
              value: number;
              sources: { node: Node | null }[];
            };
            record.__shift += shift.value;
            for (const { node } of shift.sources) {
              record.__shifted.push(
                node instanceof Element ? node.outerHTML.slice(0, 120) : String(node?.nodeName),
              );
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/");
      await page.locator(".title-sequence").waitFor();
      await page.waitForTimeout(1500);
      expect(messages.filter((text) => /hydrat|did not match/i.test(text))).toEqual([]);
      expect(messages).toEqual([]);
      const { shift, shifted } = await page.evaluate(() => {
        const record = window as unknown as { __shift: number; __shifted: string[] };
        return { shift: record.__shift, shifted: record.__shifted };
      });
      expect(shift, `shifted: ${shifted.join(" | ")}`).toBe(0);
    });
  });
});
