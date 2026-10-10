import { expect, test } from "@playwright/test";
import { uncapturePuzzle } from "./helpers/content";
import { clickCheck, openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

test("solves a Reverse Chess uncapture by taps only", async ({ page }) => {
  const puzzle = await uncapturePuzzle();
  await openPuzzle(page, puzzle);
  await expect(page.getByTestId("side-to-move")).toBeVisible();

  const square = (name: string) =>
    page.locator(`[role="group"][aria-label^="${name},"]`);

  await expect(async () => {
    await square(puzzle.to).tap();
    await square(puzzle.from).tap();
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled({
      timeout: 1000,
    });
  }).toPass({ timeout: 15_000 });

  const uncaptured = page.getByRole("radio", {
    name: `${puzzle.sideToMove} ${puzzle.uncapture}`,
  });
  await expect(async () => {
    await uncaptured.tap();
    await expect(uncaptured).toBeChecked({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });

  await clickCheck(page);
  await expect(page.getByText(/Solved/).first()).toBeVisible();
});
