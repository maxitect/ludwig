import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as looseEnds } from "../content/circle9/loose-ends";
import { cellOf, layoutOf, solve } from "../src/puzzles/circle9/engine";
import { numbers } from "../src/puzzles/circle9/verify";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, circle9Circles, databaseAvailable } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T089";
const MAX_TABS = 120;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionOf = () =>
  (solve(layoutOf({ numbers: numbers(looseEnds) })) ?? [])
    .map(cellOf)
    .sort((a, b) => a.row - b.row || a.col - b.col);

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "numbers circled" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Circle9 grid" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The circle9 grid never received keyboard focus");
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

/** Walks the cursor from `at` with the arrow keys and presses Space on each cell. */
async function circle(page: Page, cells: Cell[], at: Cell = { row: 0, col: 0 }) {
  let position = at;
  for (const target of cells) {
    position = await walk(page, position, target);
    await page.keyboard.press("Space");
  }
  return position;
}

test("solve by keyboard, keep the circles across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t089-key");
  const cells = solutionOf();
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "circle9", slug: "loose-ends" });
  await tabIntoGrid(page);

  await circle(page, cells.slice(0, 4));
  await expect(status(page)).toHaveText("4 of 9 numbers circled");
  await expect
    .poll(async () => circle9Circles(email))
    .toEqual(cells.slice(0, 4));
  await expect(cell(page, cells[0].row, cells[0].col)).toHaveAttribute(
    "aria-label",
    /number \d, circled$/,
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(status(page)).toHaveText("4 of 9 numbers circled");
  await expect(cell(page, cells[0].row, cells[0].col)).toHaveAttribute(
    "aria-label",
    /circled$/,
  );

  await tabIntoGrid(page);
  await circle(page, cells.slice(4), { row: 0, col: 0 });
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(await circle9Circles(email)).toEqual(cells);
});

test("marks clashing circles, and looks right in both themes", async ({
  page,
}, testInfo) => {
  const cells = solutionOf();
  await openPuzzle(page, { typeKey: "circle9", slug: "loose-ends" });
  await expect(page.getByRole("grid", { name: "Circle9 grid" })).toBeVisible();

  for (const { row, col } of cells.slice(0, 4)) {
    await cell(page, row, col).click();
  }
  const first = cells[0];
  const taken = new Set(cells.map(({ row, col }) => `${row},${col}`));
  const clash = numbers(looseEnds).find(
    ({ row, col }) =>
      !taken.has(`${row},${col}`) && (row === first.row || col === first.col),
  )!;
  await cell(page, clash.row, clash.col).click();
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    /breaks a rule/,
  );

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.screenshot({
      path: `${SHOTS}/ac6-${theme}-${width}.png`,
      fullPage: true,
    });
  }
});
