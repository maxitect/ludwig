import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/reflections/shop-window";
import { solve } from "../src/puzzles/reflections/engine";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  attemptsFor,
  databaseAvailable,
  reflectionsMirrorCount,
} from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T098";
const MAX_TABS = 80;
const KEY = { slash: "/", backslash: "\\" } as const;

type Cell = { row: number; col: number };

const cell = (page: Page, { row, col }: Cell) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const grid = (page: Page) => page.getByRole("grid", { name: "Reflections grid" });
const answer = () => solve(content) ?? [];
const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "pairs joined" });

async function tabInto(page: Page, selector: string) {
  await expect(grid(page)).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((sel) => document.activeElement?.matches(sel), selector)) {
      return;
    }
  }
  throw new Error(`Nothing matching ${selector} received keyboard focus`);
}

async function walk(page: Page, from: Cell, to: Cell) {
  for (let row = from.row; row !== to.row; ) {
    const down = row < to.row;
    await page.keyboard.press(down ? "ArrowDown" : "ArrowUp");
    row += down ? 1 : -1;
  }
  for (let col = from.col; col !== to.col; ) {
    const right = col < to.col;
    await page.keyboard.press(right ? "ArrowRight" : "ArrowLeft");
    col += right ? 1 : -1;
  }
  return to;
}

async function place(page: Page, mirrors: ReturnType<typeof answer>, at: Cell) {
  let position = at;
  for (const { row, col, mirror } of mirrors) {
    position = await walk(page, position, { row, col });
    await page.keyboard.press(KEY[mirror]);
  }
  return position;
}

test("solve by keyboard alone, keep the mirrors across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t098-key");
  const mirrors = answer();
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "reflections", slug: "shop-window" });
  await tabInto(page, '[role="gridcell"]');

  await place(page, mirrors.slice(0, 3), { row: 0, col: 0 });
  await expect.poll(() => reflectionsMirrorCount(email)).toBe(3);

  await page.reload();
  await hydrated(grid(page));
  const [first] = mirrors;
  await expect(cell(page, first)).toHaveAttribute(
    "aria-label",
    first.mirror === "slash" ? /forward slash mirror/ : /backslash mirror/,
  );

  await tabInto(page, '[role="gridcell"]');
  const focused = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  expect(focused).toMatch(/^Row \d+, column \d+/);
  await place(page, mirrors.slice(3), {
    row: Number(focused!.match(/^Row (\d+)/)![1]) - 1,
    col: Number(focused!.match(/column (\d+)/)![1]) - 1,
  });
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(await reflectionsMirrorCount(email)).toBe(mirrors.length);
});

test("focusing a camera announces and draws its beam, which respects reduced motion", async ({
  page,
}, testInfo) => {
  await openPuzzle(page, { typeKey: "reflections", slug: "shop-window" });
  await tabInto(page, "[data-port]");
  const note = page.getByTestId("beam-note");
  await expect(note).toContainText("currently exits");
  const label = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  expect(label).toMatch(/^Camera [A-Z], .* edge, (column|row) \d+\. Its beam currently exits/);

  const beam = page.locator("[data-beam]");
  await expect(beam).toBeVisible();
  expect(
    await beam.evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("beam-draw");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await beam.evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await beam.evaluate((node) =>
    Promise.all(node.getAnimations().map(({ finished }) => finished)),
  );

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
      window.scrollTo(0, 0);
    }, theme);
    await page.screenshot({
      path: `${SHOTS}/ac6-${theme}-${width}.png`,
      fullPage: true,
    });
  }
});

test("a satisfied pair turns ink", async ({ page }) => {
  await openPuzzle(page, { typeKey: "reflections", slug: "shop-window" });
  await expect(grid(page)).toBeVisible();
  await expect(status(page)).toHaveText(/^\d+ of \d+ pairs joined$/);
  const total = Number((await status(page).textContent())!.match(/of (\d+)/)![1]);
  for (const { row, col, mirror } of answer()) {
    await cell(page, { row, col }).click();
    if (mirror === "backslash") await cell(page, { row, col }).click();
  }
  await expect(status(page)).toHaveText(`${total} of ${total} pairs joined`);
  await expect(page.locator('[data-port][data-joined="true"]')).toHaveCount(
    total * 2,
  );
});
