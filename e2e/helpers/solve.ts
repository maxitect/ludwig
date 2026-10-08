import { expect, type Page } from "@playwright/test";

type CrosswordCell = { row: number; col: number; letter: string };

export async function openPuzzle(
  page: Page,
  puzzle: { typeKey: string; slug: string },
) {
  await page.goto(`/puzzles/${puzzle.typeKey}/${puzzle.slug}`);
}

export async function typeAnagram(page: Page, letters: string) {
  const board = page.getByRole("group", { name: "Anagram", exact: true });
  await expect(board).toBeVisible();
  await board.focus();
  await page.keyboard.type(letters);
}

export const crosswordCell = (page: Page, { row, col }: CrosswordCell) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

export async function fillCrossword(page: Page, cells: CrosswordCell[]) {
  for (const cell of cells) {
    await crosswordCell(page, cell).click();
    await page.keyboard.type(cell.letter);
  }
}

export const expectCellLetter = (page: Page, cell: CrosswordCell) =>
  expect(crosswordCell(page, cell)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${cell.letter}$`),
  );

/** Check is a button on desktop and a menu item in solve mode on touch phones. */
export async function clickCheck(page: Page) {
  const menu = page.getByRole("button", { name: "Puzzle menu" });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole("menuitem", { name: "Check" }).click();
    return;
  }
  await page.getByRole("button", { name: "Check", exact: true }).click();
}

export async function checkSolved(page: Page) {
  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
}
