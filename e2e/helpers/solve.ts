import { expect, type Page } from "@playwright/test";

type CrosswordCell = { row: number; col: number; letter: string };

/** The solver renders on the server and its chunk loads on demand, so wait for it to hydrate before any input. */
export async function openPuzzle(
  page: Page,
  puzzle: { typeKey: string; slug: string },
) {
  await page.goto(`/puzzles/${puzzle.typeKey}/${puzzle.slug}`);
  await page.waitForLoadState("networkidle");
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

/** Check is an inline button on every viewport. */
export async function clickCheck(page: Page) {
  await page.getByRole("button", { name: "Check", exact: true }).click();
}

export async function checkSolved(page: Page) {
  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
}
