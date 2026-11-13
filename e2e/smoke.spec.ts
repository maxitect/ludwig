import { expect, test } from "@playwright/test";
import { quickCrosswordPuzzle } from "./helpers/content";
import { crosswordCell, expectCellLetter, openPuzzle } from "./helpers/solve";

test.describe("signed out", { tag: "@smoke" }, () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("the puzzle library lists every category", async ({ page }) => {
    const response = await page.goto("/puzzles");
    expect(response?.status()).toBe(200);
    for (const name of [
      "Flagship",
      "Word",
      "Logic",
      "Spatial",
      "James's Notebooks",
      "Numbers",
    ]) {
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
  });

  test("a crossword solve page takes a letter", async ({ page }) => {
    const crossword = await quickCrosswordPuzzle();
    const [first] = crossword.cells;
    await openPuzzle(page, crossword);
    await expect(page.getByRole("grid", { name: "Crossword" })).toBeVisible();
    await expect(async () => {
      await crosswordCell(page, first).click();
      await page.keyboard.type(first.letter);
      await expectCellLetter(page, first);
    }).toPass({ timeout: 15_000 });
  });
});
