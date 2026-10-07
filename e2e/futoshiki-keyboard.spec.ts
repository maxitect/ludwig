import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { futoshikiPuzzle } from "./helpers/content";
import {
  attemptsFor,
  databaseAvailable,
  futoshikiAttemptCounts,
} from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

/** Tabs from the top of the page until the futoshiki grid holds focus. */
async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Futoshiki" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The futoshiki grid never received keyboard focus");
}

test("solve a futoshiki with the keyboard only", async ({ page }) => {
  const email = uniqueEmail("flow6");
  const futoshiki = await futoshikiPuzzle();
  const { size } = futoshiki;

  await signUp(page, email);
  await openPuzzle(page, futoshiki);
  await tabIntoGrid(page);

  await expect(
    page.getByRole("gridcell", { name: /less than the cell to the right/ }).first(),
  ).toBeVisible();

  for (let row = 0; row < size; row++) {
    const forward = row % 2 === 0;
    for (let step = 0; step < size; step++) {
      const col = forward ? step : size - 1 - step;
      const { digit } = futoshiki.solution[row * size + col];
      await page.keyboard.press(String(digit));
      if (step < size - 1) {
        await page.keyboard.press(forward ? "ArrowRight" : "ArrowLeft");
      }
    }
    if (row < size - 1) await page.keyboard.press("ArrowDown");
  }

  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await attemptsFor(email))[0]?.completed)
      .toBe(true);
  }
});

test("digits and notes survive a reload", async ({ page }) => {
  const email = uniqueEmail("flow6-save");
  const futoshiki = await futoshikiPuzzle();
  const open = futoshiki.solution.filter(
    ({ row, col }) =>
      !futoshiki.givens.some((g) => g.row === row && g.col === col),
  );
  const [first, second] = open;

  await signUp(page, email);
  await openPuzzle(page, futoshiki);
  await tabIntoGrid(page);

  await cell(page, first.row, first.col).click();
  await page.keyboard.press(String(first.digit));
  await cell(page, second.row, second.col).click();
  await page.keyboard.press("n");
  await page.keyboard.press("2");
  await page.keyboard.press("3");
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers(),
  );
  await page.keyboard.press("n");
  await autosave;

  if (databaseAvailable) {
    await expect
      .poll(async () => futoshikiAttemptCounts(email))
      .toEqual({ cells: 1, notes: 2 });
  }
  await page.reload();
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${first.digit}$`),
  );
  await expect(cell(page, second.row, second.col)).toContainText("2");
  await expect(cell(page, second.row, second.col)).toContainText("3");
});
