import { expect, test, type Page } from "@playwright/test";
import { sudokuPuzzle } from "./helpers/content";
import { openPuzzle } from "./helpers/solve";

const KEY = "ludwig:device-keyboard";

const pad = (page: Page) =>
  page.getByTestId("keyboard-demo").getByRole("group", { name: "Keyboard" });
const gridInput = (page: Page) => page.getByLabel("Demo grid input");
const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row}, column ${col},"]`,
  );

test("desktop grid input keeps its normal input mode", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop only");
  await page.goto("/dev/kitchen-sink");
  await expect(gridInput(page)).toBeAttached();
  await expect(gridInput(page)).not.toHaveAttribute("inputmode", "none");
  await expect(pad(page)).toHaveCount(0);
});

test.describe("puzzle keyboard", () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "touch phones only");
    await page.goto("/dev/kitchen-sink");
    await expect(pad(page)).toBeVisible();
  });

  test("hidden input does not raise the system keyboard", async ({ page }) => {
    await expect(gridInput(page)).toHaveAttribute("inputmode", "none");
  });

  test("focus stays on the grid input while keys are tapped", async ({
    page,
  }) => {
    await cell(page, 1, 1).tap();
    for (const name of ["Q", "A", "Delete"]) {
      await pad(page).getByRole("button", { name, exact: true }).tap();
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.activeElement?.getAttribute("aria-label"),
          ),
        )
        .toBe("Demo grid input");
    }
  });

  test("a physical key hides the pad and a tap on the grid restores it", async ({
    page,
  }) => {
    await cell(page, 1, 1).tap();
    await page.keyboard.press("B");
    await expect(pad(page)).toHaveCount(0);
    await cell(page, 1, 1).tap();
    await expect(pad(page)).toBeVisible();
  });

  test("the device-keyboard setting turns the pad off and persists", async ({
    page,
  }) => {
    await page.evaluate((key) => localStorage.setItem(key, "1"), KEY);
    await page.reload();
    await expect(gridInput(page)).not.toHaveAttribute("inputmode", "none");
    await expect(pad(page)).toHaveCount(0);
  });

  test("the solve menu toggles and keeps the setting", async ({ page }) => {
    const puzzle = await sudokuPuzzle();
    await openPuzzle(page, puzzle);
    const menu = page.getByRole("button", { name: "Puzzle menu" });
    await menu.click();
    const item = () =>
      page.getByRole("menuitemcheckbox", { name: "Use my device's keyboard" });
    await expect(item()).toHaveAttribute("aria-checked", "false");
    await item().click();
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), KEY))
      .toBe("1");
    await page.reload();
    await menu.click();
    await expect(item()).toHaveAttribute("aria-checked", "true");
  });
});
