import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as nightTrain } from "../content/railroad/night-train";
import { content as terminus } from "../content/railroad/terminus";
import { OPEN, solve } from "../src/puzzles/railroad/engine";
import type { Content } from "../src/puzzles/railroad/schema";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, databaseAvailable, railroadAttemptCounts } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T086";
const MAX_TABS = 120;
const KEY_OF = Object.fromEntries(
  (Object.keys(OPEN) as (keyof typeof OPEN)[]).map((piece, i) => [piece, String(i + 1)]),
);

type Cell = { row: number; col: number };

const cell = (page: Page, { row, col }: Cell) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1}"]`,
  );

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "counts met" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Railroad grid" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The railroad grid never received keyboard focus");
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

const track = (content: Content) => solve(content) ?? [];
const isGiven = (content: Content, { row, col }: Cell) =>
  content.given.some((piece) => piece.row === row && piece.col === col);

/** Walks the cursor with the arrow keys and presses each piece's number key. */
async function lay(
  page: Page,
  pieces: ReturnType<typeof track>,
  at: Cell = { row: 0, col: 0 },
) {
  let position = at;
  for (const { row, col, piece } of pieces) {
    position = await walk(page, position, { row, col });
    await page.keyboard.press(KEY_OF[piece]);
  }
  return position;
}

test("solve by keyboard alone, keep the pieces across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t086-key");
  const laid = track(nightTrain).filter((piece) => !isGiven(nightTrain, piece));
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "railroad", slug: "night-train" });
  await tabIntoGrid(page);

  const end = await lay(page, laid.slice(0, 5));
  await walk(page, end, { row: 5, col: 5 });
  await page.keyboard.press("x");
  await expect.poll(() => railroadAttemptCounts(email)).toEqual({ pieces: 5, crosses: 1 });

  await page.reload();
  await hydrated(page.getByRole("grid", { name: "Railroad grid" }));
  await expect(cell(page, { row: 5, col: 5 })).toHaveAttribute("aria-label", /crossed$/);
  await expect(cell(page, laid[0])).toHaveAttribute("aria-label", /track /);

  await tabIntoGrid(page);
  await lay(page, laid.slice(5));
  await expect(status(page)).toHaveText(
    `${nightTrain.rows + nightTrain.cols} of ${nightTrain.rows + nightTrain.cols} counts met`,
  );
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect.poll(async () => (await attemptsFor(email))[0]?.completed).toBe(true);
  expect((await railroadAttemptCounts(email)).pieces).toBe(laid.length);
});

test("a drag lays the track in both themes", async ({ page }, testInfo) => {
  test.skip(!databaseAvailable, "needs the local database");
  if (testInfo.project.name !== "mobile") {
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  const email = uniqueEmail("t086-drag");
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "railroad", slug: "terminus" });
  const grid = page.getByRole("grid", { name: "Railroad grid" });
  await expect(grid).toBeVisible();

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  const shoot = async (name: string) => {
    for (const theme of ["paper", "ink"]) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        theme,
      );
      await grid.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: `${SHOTS}/ac7-${name}-${theme}-${width}.png` });
    }
  };
  await shoot("start");

  const path = track(terminus);
  const centre = async (at: Cell) => {
    await cell(page, at).scrollIntoViewIfNeeded();
    const box = await cell(page, at).boundingBox();
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  };
  // Split at a straight piece, where a drag's guess for an open end is right.
  const half =
    path.findIndex(
      ({ piece }, i) => i >= path.length / 2 && (piece === "ns" || piece === "ew"),
    ) + 1;
  const start = await centre(path[0]);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const at of path.slice(1, half)) {
    const next = await centre(at);
    await page.mouse.move(next.x, next.y);
  }
  await page.mouse.up();
  await shoot("partial");

  const resume = await centre(path[half - 1]);
  await page.mouse.move(resume.x, resume.y);
  await page.mouse.down();
  for (const at of path.slice(half)) {
    const next = await centre(at);
    await page.mouse.move(next.x, next.y);
  }
  await page.mouse.up();
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(grid).toHaveAttribute("data-solved", "true");
  await expect.poll(async () => (await attemptsFor(email))[0]?.completed).toBe(true);
  await shoot("solved");
});
