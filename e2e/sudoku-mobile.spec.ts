import { expect, test, type Locator, type Page } from "@playwright/test";
import { futoshikiPuzzle, sudokuPuzzle } from "./helpers/content";
import { openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const SIZE = 9;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );
const pad = (page: Page) => page.getByRole("group", { name: "Keyboard" });
const key = (page: Page, name: string) =>
  pad(page).getByRole("button", { name, exact: true });

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

test("grid and pad are in view without overlap", async ({ page }) => {
  await openPuzzle(page, await sudokuPuzzle());
  await expect(pad(page)).toBeVisible();
  const viewport = page.viewportSize()!;
  const grid = await box(page.getByRole("grid", { name: "Sudoku" }));
  const keys = await box(pad(page));
  expect(grid.y).toBeGreaterThanOrEqual(0);
  expect(grid.x + grid.width).toBeLessThanOrEqual(viewport.width);
  expect(grid.y + grid.height).toBeLessThanOrEqual(keys.y);
  expect(keys.y + keys.height).toBeLessThanOrEqual(viewport.height);
  await expect(key(page, "Notes")).toBeVisible();
  await expect(key(page, "Clear notes")).toBeVisible();
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({
      path: `.verification/T116/sudoku-${scheme}.png`,
    });
  }
});

test("futoshiki grid and pad are in view without overlap", async ({ page }) => {
  await openPuzzle(page, await futoshikiPuzzle());
  await expect(pad(page)).toBeVisible();
  const viewport = page.viewportSize()!;
  const grid = await box(page.getByRole("grid", { name: "Futoshiki" }));
  const keys = await box(pad(page));
  expect(grid.y).toBeGreaterThanOrEqual(0);
  expect(grid.x + grid.width).toBeLessThanOrEqual(viewport.width);
  expect(grid.y + grid.height).toBeLessThanOrEqual(keys.y);
  expect(keys.y + keys.height).toBeLessThanOrEqual(viewport.height);
  await expect(key(page, "Notes")).toBeVisible();
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({
      path: `.verification/T116/futoshiki-${scheme}.png`,
    });
  }
});

test("a sudoku is solved by tapping, with a note on the way", async ({
  page,
}) => {
  const sudoku = await sudokuPuzzle();
  await openPuzzle(page, sudoku);
  await expect(pad(page)).toBeVisible();

  const empties = sudoku.solution
    .map((entry, index) => ({
      ...entry,
      row: Math.floor(index / SIZE),
      col: index % SIZE,
    }))
    .filter(
      ({ row, col }) =>
        !sudoku.givens.some((given) => given.row === row && given.col === col),
    );
  const [first] = empties;

  await cell(page, first.row, first.col).tap();
  await key(page, "Notes").tap();
  await key(page, String(first.digit)).tap();
  await expect(cell(page, first.row, first.col)).toContainText(
    String(first.digit),
  );
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    /, empty$/,
  );
  await key(page, "Notes").tap();

  for (const { row, col, digit } of empties) {
    await cell(page, row, col).tap();
    await key(page, String(digit)).tap();
  }
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(page.getByTestId("solved-stamp")).toContainText("Solved.");
});
