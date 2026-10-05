import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { sudokuPuzzle } from "./helpers/content";
import { attemptsFor, databaseAvailable, sudokuAttemptCounts } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SIZE = 9;
const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

/** Tabs from the top of the page until the sudoku grid holds focus. */
async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Sudoku" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The sudoku grid never received keyboard focus");
}

test("solve a sudoku with the keyboard only", async ({ page }) => {
  const email = uniqueEmail("flow5");
  const sudoku = await sudokuPuzzle();

  await signUp(page, email);
  await openPuzzle(page, sudoku);
  await tabIntoGrid(page);

  for (let row = 0; row < SIZE; row++) {
    const forward = row % 2 === 0;
    for (let step = 0; step < SIZE; step++) {
      const col = forward ? step : SIZE - 1 - step;
      const { digit } = sudoku.solution[row * SIZE + col];
      await page.keyboard.press(String(digit));
      if (step < SIZE - 1) {
        await page.keyboard.press(forward ? "ArrowRight" : "ArrowLeft");
      }
    }
    if (row < SIZE - 1) await page.keyboard.press("ArrowDown");
  }

  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await attemptsFor(email))[0]?.completed)
      .toBe(true);
  }
});

test("digits and notes survive a reload", async ({ page }) => {
  const email = uniqueEmail("flow5-save");
  const sudoku = await sudokuPuzzle();
  const firstEmpty = sudoku.solution.find(
    ({ row, col }) =>
      !sudoku.givens.some((g) => g.row === row && g.col === col),
  )!;
  const next = sudoku.solution.find(
    ({ row, col }) =>
      (row > firstEmpty.row || (row === firstEmpty.row && col > firstEmpty.col)) &&
      !sudoku.givens.some((g) => g.row === row && g.col === col),
  )!;

  await signUp(page, email);
  await openPuzzle(page, sudoku);
  await tabIntoGrid(page);

  await cell(page, firstEmpty.row, firstEmpty.col).click();
  await page.keyboard.press(String(firstEmpty.digit));
  await cell(page, next.row, next.col).click();
  await page.keyboard.press("n");
  await page.keyboard.press("2");
  await page.keyboard.press("7");
  await page.keyboard.press("n");

  if (databaseAvailable) {
    await expect
      .poll(async () => sudokuAttemptCounts(email))
      .toEqual({ cells: 1, notes: 2 });
  }
  await page.reload();
  await expect(cell(page, firstEmpty.row, firstEmpty.col)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${firstEmpty.digit}$`),
  );
  await expect(cell(page, next.row, next.col)).toContainText("2");
  await expect(cell(page, next.row, next.col)).toContainText("7");
});
