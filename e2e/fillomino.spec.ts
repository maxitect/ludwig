import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as firstFooting } from "../content/fillomino/first-footing";
import { solve } from "../src/puzzles/fillomino/engine";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  attemptsFor,
  databaseAvailable,
  fillominoAttemptCellCount,
} from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T096";
const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionCells = () => solve(firstFooting) ?? [];
const given = () =>
  new Set(firstFooting.givens.map(({ row, col }) => `${row},${col}`));

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "cells filled" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Fillomino" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The fillomino grid never received keyboard focus");
}

type Cell = { row: number; col: number };

async function walk(page: Page, from: Cell, to: Cell) {
  for (let row = from.row; row !== to.row;) {
    const down = row < to.row;
    await page.keyboard.press(down ? "ArrowDown" : "ArrowUp");
    row += down ? 1 : -1;
  }
  for (let col = from.col; col !== to.col;) {
    const right = col < to.col;
    await page.keyboard.press(right ? "ArrowRight" : "ArrowLeft");
    col += right ? 1 : -1;
  }
  return to;
}

async function fill(
  page: Page,
  cells: ReturnType<typeof solutionCells>,
  at: Cell = { row: 0, col: 0 },
) {
  const skip = given();
  let position = at;
  for (const { row, col, digit } of cells) {
    if (skip.has(`${row},${col}`)) continue;
    position = await walk(page, position, { row, col });
    await page.keyboard.press(String(digit));
  }
  return position;
}

test("solve by keyboard, keep the digits across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t096-key");
  const cells = solutionCells();
  const skip = given();
  const open = cells.filter(({ row, col }) => !skip.has(`${row},${col}`));
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "fillomino", slug: "first-footing" });
  await tabIntoGrid(page);

  await fill(page, open.slice(0, 4));
  await expect(status(page)).toHaveText(
    `${skip.size + 4} of ${cells.length} cells filled`,
  );
  await expect.poll(() => fillominoAttemptCellCount(email)).toBe(4);

  await page.reload();
  await hydrated(page.getByRole("grid", { name: "Fillomino" }));
  await expect(status(page)).toHaveText(
    `${skip.size + 4} of ${cells.length} cells filled`,
  );
  await expect(cell(page, open[0].row, open[0].col)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${open[0].digit}$`),
  );

  await tabIntoGrid(page);
  await fill(page, open.slice(4));
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(await fillominoAttemptCellCount(email)).toBe(open.length);
});

test("marks an oversized area, and stays legible in both themes", async ({
  page,
}, testInfo) => {
  await openPuzzle(page, { typeKey: "fillomino", slug: "first-footing" });
  await expect(page.getByRole("grid", { name: "Fillomino" })).toBeVisible();
  const [first, second] = solutionCells().filter(
    ({ row, col }) => !given().has(`${row},${col}`) && row === 5,
  );
  await cell(page, first.row, first.col).click();
  await page.keyboard.press("1");
  await cell(page, second.row, second.col).click();
  await page.keyboard.press("1");
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    /breaks a rule/,
  );

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
      window.scrollTo(0, 0);
    }, theme);
    await page.screenshot({
      path: `${SHOTS}/ac5-${theme}-${width}.png`,
      fullPage: true,
    });
  }
});
