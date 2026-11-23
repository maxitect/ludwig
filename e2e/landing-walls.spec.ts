import { mkdirSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/** CPU benchmark time on the dev machine. The GitHub runner is ~5x slower and software-rasterises, so scrub frames land on 30fps boundaries there whatever the throttle; a runner that slow is allowed one dropped vsync. */
const REFERENCE_BENCH_MS = 96;
const SHOTS = ".verification/T171";
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
] as const;

const ROOMS = [
  { wall: ".seq-wall-grid", from: 0.06, to: 0.26 },
  { wall: ".seq-wall-board", from: 0.41, to: 0.58 },
  { wall: ".seq-wall-mirror", from: 0.72, to: 1 },
] as const;

const PANS = [
  { from: 0.26, to: 0.41 },
  { from: 0.58, to: 0.72 },
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
    window.scrollTo(0, Math.min(Math.ceil(top + value * span), Math.floor(top + span)));
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

const SIZES = [
  { width: 2000, height: 1245 },
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1280, height: 650 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

type Path = "timeline" | "fallback";

/** Room-ownership helper: every plane of room n is painted one flat colour, the floor another and everything else on the stage is hidden, so a screenshot says which room owns each pixel (rectangles can't, they ignore what a nearer wall hides). */
const ROOM_COLOURS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 0, 255],
] as const;
const FLOOR_COLOUR = [128, 128, 128] as const;

function ownershipStyle() {
  const rgb = ([r, g, b]: readonly number[]) => `rgb(${r}, ${g}, ${b})`;
  const paint = (selector: string, colour: readonly number[]) =>
    `${selector} { background: ${rgb(colour)} !important; background-image: none !important; border-color: ${rgb(colour)} !important; }`;
  const rooms = ROOM_COLOURS.map((colour, index) => {
    const room = `.seq-room[data-room-index="${index}"]`;
    return [paint(`${room} .seq-plane`, colour.map((channel) => channel / 2)), paint(`${room} .seq-wall`, colour)].join("\n");
  }).join("\n");
  return `
body::before { display: none !important; }
.seq-stage { background: rgb(0, 0, 0) !important; }
.seq-plane > * { visibility: hidden !important; }
${paint(".seq-room[data-room-index] .seq-plane.seq-floor", FLOOR_COLOUR)}
.seq-raking, .seq-hero, .seq-walker, .seq-captions, .seq-piece { visibility: hidden !important; }
${rooms}`;
}

/** Opens `/` at `size`. The fallback path is forced in Chromium the way Firefox takes it: view timeline off, progress from scroll. */
async function openOn(page: Page, size: { width: number; height: number }, path: Path) {
  if (path === "fallback") {
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent =
        ".title-sequence * { animation-timeline: auto !important; animation-duration: 1s !important; animation-play-state: paused !important; animation-delay: calc(var(--seq-progress, 0) * -1s) !important; animation-range: normal !important; }";
      const update = () => {
        const root = document.querySelector<HTMLElement>(".title-sequence");
        const track = root?.querySelector<HTMLElement>(".seq-track");
        if (!root || !track) return;
        root.dataset.seqScroll = "";
        const span = track.offsetHeight - window.innerHeight;
        const progress =
          span > 0
            ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / span))
            : 0;
        root.style.setProperty("--seq-progress", progress.toFixed(4));
      };
      new MutationObserver((_, observer) => {
        if (!document.head) return;
        document.head.append(style);
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      document.addEventListener("DOMContentLoaded", update);
    });
  }
  await open(page, size);
  await page.evaluate(() => {
    document.querySelectorAll(".seq-room").forEach((room, index) => {
      (room as HTMLElement).dataset.roomIndex = String(index);
    });
  });
}

type Ownership = {
  /** Pixels per room: its back wall and its side walls. */
  rooms: number[];
  /** Pixels per room's back wall alone, the view into the room. */
  backs: number[];
  floor: number;
  other: number;
  /** The stage's left and right edge pixel columns top to bottom, as run-length strings like `other,room0,floor`. */
  left: string;
  right: string;
  stage: { left: number; top: number; right: number; bottom: number };
  walls: { left: number; top: number; right: number; bottom: number }[];
};

async function ownership(page: Page): Promise<Ownership> {
  const png = (await page.locator(".seq-stage").screenshot({ scale: "css" })).toString("base64");
  return page.evaluate(
    async ({ data, rooms, floor }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(image, 0, 0);
      const { data: pixels } = context.getImageData(0, 0, image.width, image.height);
      const near = (index: number, colour: readonly number[]) =>
        Math.abs(pixels[index] - colour[0]) <= 6 &&
        Math.abs(pixels[index + 1] - colour[1]) <= 6 &&
        Math.abs(pixels[index + 2] - colour[2]) <= 6;
      const classify = (index: number) => {
        for (const [room, colour] of rooms.entries()) {
          if (near(index, colour)) return `room${room}`;
          if (near(index, colour.map((channel) => channel / 2))) return `room${room}`;
        }
        return near(index, floor) ? "floor" : "other";
      };
      const counts = new Array<number>(rooms.length).fill(0);
      const backCounts = new Array<number>(rooms.length).fill(0);
      let floorCount = 0;
      let other = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const name = classify(index);
        if (name === "floor") floorCount++;
        else if (name === "other") other++;
        else {
          const room = Number(name.slice(4));
          counts[room]++;
          if (near(index, rooms[room])) backCounts[room]++;
        }
      }
      const column = (x: number) => {
        const runs: string[] = [];
        for (let y = 0; y < image.height; y++) {
          const name = classify((y * image.width + x) * 4);
          if (runs.at(-1) !== name) runs.push(name);
        }
        return runs.join(",");
      };
      const rect = (element: Element) => {
        const { left, top, right, bottom } = element.getBoundingClientRect();
        return { left, top, right, bottom };
      };
      return {
        rooms: counts,
        backs: backCounts,
        floor: floorCount,
        other,
        left: column(0),
        right: column(image.width - 1),
        stage: rect(document.querySelector(".seq-stage")!),
        walls: [...document.querySelectorAll(".seq-wall")].map(rect),
      };
    },
    { data: png, rooms: ROOM_COLOURS.map((colour) => [...colour]), floor: [...FLOOR_COLOUR] },
  );
}

const steps = (from: number, to: number) =>
  Array.from({ length: Math.round((to - from) * 100) + 1 }, (_, index) => (Math.round(from * 100) + index) / 100);

/** The rooms that have any pixels. */
const roomsInFrame = (shot: Ownership) =>
  shot.rooms.flatMap((count, index) => (count > 0 ? [index] : []));

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
      expect(await page.locator(".seq-wall-right").count(), "a wall after each room").toBe(3);
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

      [[0.06, 0.26, 0], [0.41, 0.58, 1], [0.72, 1, 2]].forEach(([from, to, room]) => {
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
    const wanted = [0.14, 0.31, 0.5, 0.65, 0.9];
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
      expect(await page.locator(".seq-room").count(), "three rooms, no fourth").toBe(3);
      const header = await page.evaluate(() => document.querySelector("[data-site-header]")!.getBoundingClientRect().bottom);
      expect((await box(page, ".seq-stage")).top, "stage clear of the header").toBeGreaterThanOrEqual(header - 1);
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

/** Dwell and pan windows after T171: three rooms, two pans, the Mirror holds to the end of the track. */
const DWELLS = [
  { room: 0, from: 0.06, to: 0.26 },
  { room: 1, from: 0.41, to: 0.58 },
  { room: 2, from: 0.72, to: 1 },
] as const;
const PAN_WINDOWS = [
  { from: 0.26, to: 0.41 },
  { from: 0.58, to: 0.72 },
] as const;

function timelineProgress(page: Page) {
  return page.evaluate(
    () => document.querySelector(".seq-world")!.getAnimations()[0].effect!.getComputedTiming().progress!,
  );
}

async function stageAndHeader(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".seq-stage")!.getBoundingClientRect();
    const header = document.querySelector("[data-site-header]")!.getBoundingClientRect();
    const probe = (x: number) => {
      const hit = document.elementFromPoint(x, stage.top + 1);
      return hit?.closest(".seq-stage") ? "stage" : (hit?.tagName ?? "none");
    };
    return {
      stageTop: stage.top,
      stageBottom: stage.bottom,
      headerBottom: header.bottom,
      innerHeight: window.innerHeight,
      hits: [stage.left + 1, (stage.left + stage.right) / 2, stage.right - 2].map(probe),
    };
  });
}

for (const path of ["timeline", "fallback"] as const) {
  for (const size of SIZES) {
    const label = `${path} ${size.width}x${size.height}`;

    test.describe(`one room per shot, ${label}`, () => {
      test(`AC2 AC3 the stage sits under the header for the whole track (${label})`, async ({ page }) => {
        test.setTimeout(120_000);
        await openOn(page, size, path);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
        const first = await stageAndHeader(page);
        expect(Math.abs(first.stageTop - first.headerBottom), "stage top at the header's bottom").toBeLessThanOrEqual(1);
        expect(Math.abs(first.stageBottom - first.innerHeight), "stage bottom at the viewport's bottom").toBeLessThanOrEqual(1);
        const hero = await box(page, ".seq-hero");
        expect(hero.top, "hero below the header").toBeGreaterThanOrEqual(first.headerBottom);
        expect(hero.top + hero.height, "hero inside the viewport").toBeLessThanOrEqual(first.innerHeight);
        const wordmark = await box(page, ".seq-hero svg");
        expect(wordmark.top, "wordmark below the header").toBeGreaterThanOrEqual(first.headerBottom);
        expect(await timelineProgress(page), "progress at the top").toBe(0);

        for (const progress of steps(0, 1).filter((_, index) => index % 2 === 0)) {
          await seek(page, progress);
          const now = await stageAndHeader(page);
          expect(Math.abs(now.stageTop - first.headerBottom), `stage top at ${progress}`).toBeLessThanOrEqual(1);
          expect(Math.abs(now.stageBottom - now.innerHeight), `stage bottom at ${progress}`).toBeLessThanOrEqual(1);
          expect(now.hits, `nothing of the header over the stage at ${progress}`).toEqual(["stage", "stage", "stage"]);
        }
        await seek(page, 1);
        expect(await timelineProgress(page), "progress reaches 1 at the end of the track").toBeGreaterThan(0.999);
      });

      test(`AC4 AC6 one room at every dwell and in the opening (${label})`, async ({ page, browserName }) => {
        test.skip(browserName === "firefox", "screenshots are taken in Chromium");
        test.setTimeout(240_000);
        await openOn(page, size, path);
        await page.addStyleTag({ content: ownershipStyle() });
        const failures: string[] = [];
        for (const progress of steps(0, 0.05)) {
          await seek(page, progress);
          const shot = await ownership(page);
          const others = roomsInFrame(shot).filter((room) => room !== 0);
          if (others.length) failures.push(`opening ${progress}: rooms ${others} have ${others.map((room) => shot.rooms[room])} px`);
        }
        for (const { room, from, to } of DWELLS) {
          for (const progress of steps(from, to)) {
            await seek(page, progress);
            const shot = await ownership(page);
            const others = roomsInFrame(shot).filter((index) => index !== room);
            if (others.length) failures.push(`room ${room} at ${progress}: rooms ${others} have ${others.map((index) => shot.rooms[index])} px`);
            const wall = shot.walls[room];
            if (wall.left < shot.stage.left - 1 || wall.right > shot.stage.right + 1 || wall.top < shot.stage.top - 1 || wall.bottom > shot.stage.bottom + 1) {
              failures.push(`room ${room} at ${progress}: back wall outside the stage ${JSON.stringify(wall)}`);
            }
            const pattern = new RegExp(`^(other,)?room${room}(,other)?(,floor)?(,other)?$`);
            for (const [edge, column] of [["left", shot.left], ["right", shot.right]] as const) {
              if (!pattern.test(column)) failures.push(`room ${room} at ${progress}: ${edge} edge column reads ${column}`);
            }
          }
        }
        expect(failures, failures.slice(0, 12).join("\n")).toEqual([]);
      });

      test(`AC5 only the two rooms either side of the wall show during a pan (${label})`, async ({ page, browserName }) => {
        test.skip(browserName === "firefox", "screenshots are taken in Chromium");
        test.setTimeout(240_000);
        await openOn(page, size, path);
        await page.addStyleTag({ content: ownershipStyle() });
        const failures: string[] = [];
        for (const [index, { from, to }] of PAN_WINDOWS.entries()) {
          const [leaving, entering] = [index, index + 1];
          const shots: Ownership[] = [];
          for (const progress of steps(from, to)) {
            await seek(page, progress);
            const shot = await ownership(page);
            const extra = roomsInFrame(shot).filter((room) => room !== leaving && room !== entering);
            if (extra.length) failures.push(`pan ${index + 1} at ${progress}: rooms ${extra} in frame`);
            shots.push(shot);
          }
          const slack = 0.015 * (shots[0].stage.right - shots[0].stage.left) * (shots[0].stage.bottom - shots[0].stage.top);
          const gone = shots.map((shot) => shot.backs[leaving]);
          const peak = gone.indexOf(Math.max(...gone));
          shots.forEach((shot, step) => {
            const progress = steps(from, to)[step];
            if (step > 0 && shot.backs[entering] < shots[step - 1].backs[entering] - slack) failures.push(`pan ${index + 1} at ${progress}: view into room ${entering} shrinks ${shots[step - 1].backs[entering]} to ${shot.backs[entering]}`);
            if (step > peak && shot.backs[leaving] > shots[step - 1].backs[leaving] + slack) failures.push(`pan ${index + 1} at ${progress}: view into room ${leaving} grows again after its peak ${shots[step - 1].backs[leaving]} to ${shot.backs[leaving]}`);
          });
          await seek(page, to);
          const arrived = await ownership(page);
          if (arrived.rooms[leaving] !== 0) failures.push(`pan ${index + 1}: room ${leaving} still has ${arrived.rooms[leaving]} px when the next dwell starts`);
        }
        expect(failures, failures.slice(0, 12).join("\n")).toEqual([]);
      });
    });
  }
}

test.describe("landing walls, three rooms", () => {
  test("AC7 three rooms, two pans, no finale room", async ({ page }) => {
    test.setTimeout(120_000);
    await open(page, VIEWPORTS[2]);
    expect(await page.locator(".seq-room").count()).toBe(3);
    expect(await page.locator(".seq-wall-finale").count()).toBe(0);
    expect(await page.getByRole("navigation", { name: "Rooms" }).getByRole("link").count()).toBe(3);
    const samples = await sampleCamera(page, everyHundredth);
    const moving: number[] = [];
    samples.slice(1).forEach((sample, index) => {
      if (Math.abs(sample.x - samples[index].x) > 0.01) moving.push(sample.progress);
    });
    const intervals = moving.reduce((count, progress, index) => (index === 0 || progress - moving[index - 1] > 0.0101 ? count + 1 : count), 0);
    expect(intervals, `camera moves in ${intervals} intervals: ${moving}`).toBe(2);
    const resting = samples.filter(({ progress }) => progress >= DWELLS[2].from);
    for (const { x } of resting) expect(x).toBeCloseTo(resting[0].x, 1);
  });
});

test.describe("landing walls, the Mirror ends the sequence", () => {
  test("AC8 the sequence ends on the Mirror, finished, before the closing section", async ({ page, browserName }) => {
    test.setTimeout(120_000);
    await open(page, VIEWPORTS[2]);
    for (const progress of [0.98, 1]) {
      await seek(page, progress);
      const digits = await page.locator(".seq-mirror-digit").evaluateAll((all) =>
        all.map((element) => ({ text: element.textContent, opacity: getComputedStyle(element).opacity })),
      );
      expect(digits.map(({ text }) => text), `five digits at ${progress}`).toEqual(["7", "1", "5", "9", "4"]);
      for (const { opacity: value } of digits) expect(value, `digit drawn at ${progress}`).toBe("1");
    }
    const closing = await page.evaluate(() => {
      const track = document.querySelector(".seq-track")!.getBoundingClientRect();
      const next = document.querySelector(".seq-track")!.nextElementSibling!;
      return { next: next.className, afterTrack: next.getBoundingClientRect().top - track.bottom, button: next.textContent };
    });
    expect(closing.next).toContain("seq-closing");
    expect(Math.abs(closing.afterTrack)).toBeLessThanOrEqual(1);
    expect(closing.button).toContain("Open the Collection");
    if (browserName === "firefox") return;
    await page.addStyleTag({ content: ownershipStyle() });
    for (const progress of [0.98, 1]) {
      await seek(page, progress);
      const shot = await ownership(page);
      expect(roomsInFrame(shot), `only the Mirror at ${progress}`).toEqual([2]);
    }
  });
});
