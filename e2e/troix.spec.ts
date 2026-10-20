import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as threeOfAKind } from "../content/troix/three-of-a-kind";
import { solve } from "../src/puzzles/troix/engine";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, databaseAvailable, troixCells } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T088";
const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionCells = () => solve(threeOfAKind) ?? [];

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "cells filled" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Troix" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The troix grid never received keyboard focus");
}

type Cell = { row: number; col: number };

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

/** Walks the cursor from `at` with the arrow keys and types each symbol, skipping the givens. */
async function fill(
  page: Page,
  cells: ReturnType<typeof solutionCells>,
  at: Cell = { row: 0, col: 0 },
) {
  const given = new Set(
    threeOfAKind.givens.map(({ row, col }) => `${row},${col}`),
  );
  let position = at;
  for (const { row, col, symbol } of cells) {
    if (given.has(`${row},${col}`)) continue;
    position = await walk(page, position, { row, col });
    await page.keyboard.press(symbol);
  }
  return position;
}

test("solve by keyboard, keep the symbols across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t088-key");
  const cells = solutionCells();
  const given = new Set(
    threeOfAKind.givens.map(({ row, col }) => `${row},${col}`),
  );
  const open = cells.filter(({ row, col }) => !given.has(`${row},${col}`));
  const total = cells.length;
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "troix", slug: "three-of-a-kind" });
  await tabIntoGrid(page);

  await fill(page, open.slice(0, 4));
  await expect(status(page)).toHaveText(
    `${given.size + 4} of ${total} cells filled`,
  );
  await expect
    .poll(async () =>
      (await troixCells(email)).reduce((sum, row) => sum + row.count, 0),
    )
    .toBe(4);

  await page.reload();
  await hydrated(page.getByRole("grid", { name: "Troix" }));
  await expect(status(page)).toHaveText(
    `${given.size + 4} of ${total} cells filled`,
  );
  const first = open[0];
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${first.symbol.toUpperCase()}$`),
  );

  await tabIntoGrid(page);
  await fill(page, open.slice(4));
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(
    (await troixCells(email)).reduce((sum, row) => sum + row.count, 0),
  ).toBe(open.length);
});

test("taps cycle X, O, I and empty, mark a line over its quota, and look right in both themes", async ({
  page,
}, testInfo) => {
  await openPuzzle(page, { typeKey: "troix", slug: "three-of-a-kind" });
  await expect(page.getByRole("grid", { name: "Troix" })).toBeVisible();
  const given = new Set(
    threeOfAKind.givens.map(({ row, col }) => `${row},${col}`),
  );
  const free = Array.from({ length: 6 }, (_, col) => ({ row: 5, col })).filter(
    ({ row, col }) => !given.has(`${row},${col}`),
  );
  const target = cell(page, free[0].row, free[0].col);
  for (const letter of ["X", "O", "I"]) {
    await target.click();
    await expect(target).toHaveAttribute(
      "aria-label",
      new RegExp(`, ${letter}(, breaks a rule)?$`),
    );
  }
  await target.click();
  await expect(target).toHaveAttribute("aria-label", /, empty$/);

  const crowded = given.has("5,2") && given.has("5,4");
  expect(crowded).toBe(true);
  for (let tap = 0; tap < 3; tap++) await target.click();
  await expect(target).toHaveAttribute("aria-label", /, I, breaks a rule$/);

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
