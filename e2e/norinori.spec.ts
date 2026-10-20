import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as inkBlots } from "../content/norinori/ink-blots";
import { layoutOf, solve } from "../src/puzzles/norinori/engine";
import { regionCells } from "../src/puzzles/norinori/verify";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, databaseAvailable, norinoriMarks } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T097";
const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionOf = () =>
  (
    solve(
      layoutOf({
        rows: inkBlots.rows,
        cols: inkBlots.cols,
        regions: regionCells(inkBlots),
      }),
    ) ?? []
  )
    .map((index) => ({
      row: Math.floor(index / inkBlots.cols),
      col: index % inkBlots.cols,
    }))
    .sort((a, b) => a.row - b.row || a.col - b.col);

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "cells shaded" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Norinori grid" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The norinori grid never received keyboard focus");
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

/** Walks the cursor from `at` with the arrow keys and presses `s` on each cell. */
async function shade(page: Page, cells: Cell[], at: Cell = { row: 0, col: 0 }) {
  let position = at;
  for (const target of cells) {
    position = await walk(page, position, target);
    await page.keyboard.press("s");
  }
  return position;
}

test("solve by keyboard, keep the marks across a reload", async ({ page }) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t097-key");
  const cells = solutionOf();
  const total = cells.length;
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "norinori", slug: "ink-blots" });
  await tabIntoGrid(page);

  const end = await shade(page, cells.slice(0, 3));
  const spare = { row: inkBlots.rows - 1, col: 0 };
  await walk(page, end, spare);
  await page.keyboard.press(".");
  await expect(status(page)).toHaveText(`3 of ${total} cells shaded`);
  await expect
    .poll(async () => norinoriMarks(email))
    .toEqual([
      { mark: "shade", count: 3 },
      { mark: "dot", count: 1 },
    ]);

  await page.reload();
  await hydrated(page.getByRole("grid", { name: "Norinori grid" }));
  await expect(status(page)).toHaveText(`3 of ${total} cells shaded`);
  await expect(cell(page, cells[0].row, cells[0].col)).toHaveAttribute(
    "aria-label",
    /shade/,
  );

  await tabIntoGrid(page);
  await shade(page, cells.slice(3), { row: 0, col: 0 });
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(
    (await norinoriMarks(email)).find((m) => m.mark === "shade")?.count,
  ).toBe(total);
});

test("draws an L-shaped tromino as wrong, and looks right in both themes", async ({
  page,
}, testInfo) => {
  const cells = solutionOf();
  const shaded = new Set(cells.map(({ row, col }) => `${row},${col}`));
  await openPuzzle(page, { typeKey: "norinori", slug: "ink-blots" });
  await expect(page.getByRole("grid", { name: "Norinori grid" })).toBeVisible();

  for (const { row, col } of cells.slice(0, 5)) await cell(page, row, col).click();
  const first = cells[0];
  const extra = [
    { row: first.row + 1, col: first.col },
    { row: first.row - 1, col: first.col },
    { row: first.row, col: first.col + 1 },
    { row: first.row, col: first.col - 1 },
  ].find(
    ({ row, col }) =>
      row >= 0 &&
      col >= 0 &&
      row < inkBlots.rows &&
      col < inkBlots.cols &&
      !shaded.has(`${row},${col}`),
  )!;
  await cell(page, extra.row, extra.col).click();
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
    await page.screenshot({ path: `${SHOTS}/ac6-${theme}-${width}.png` });
  }
});
