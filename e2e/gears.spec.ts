import { expect, type Page, test } from "@playwright/test";
import { gearPuzzle } from "./helpers/content";
import { openPuzzle } from "./helpers/solve";

type GearPuzzle = Awaited<ReturnType<typeof gearPuzzle>>;

/** Keys pressed before hydration are ignored, so the whole sequence is retried until the crank reads right. */
async function crankTo(page: Page, crank: number) {
  const driver = page.getByRole("slider", { name: /^Driver gear/ });
  await expect(async () => {
    await driver.focus();
    await page.keyboard.press("Home");
    for (let turn = 0; turn < crank; turn += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await expect(page.getByTestId("crank")).toHaveText(String(crank), {
      timeout: 1000,
    });
  }).toPass({ timeout: 15_000 });
}

async function scrubToConvergence(page: Page, convergence: number) {
  const scrubber = page.getByRole("slider", { name: "Dance scrubber" });
  await scrubber.focus();
  await page.keyboard.press("Home");
  for (let step = 1; step < convergence; step += 1) {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
  }
  await expect(scrubber).toHaveAttribute(
    "aria-valuetext",
    `Convergence ${convergence}`,
  );
  await expect(page.getByTestId("convergence-status")).toContainText(
    `Convergence ${convergence}:`,
  );
}

async function accuse(page: Page, puzzle: GearPuzzle) {
  await page.getByRole("button", { name: "Accuse", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("radio", { name: puzzle.killer }).check();
  await dialog.getByRole("button", { name: "Accuse", exact: true }).click();
  await expect(page.getByText(/Solved in/)).toBeVisible();
}

test("crank to the solution, scrub to the convergence, accuse and see the stamp", async ({
  page,
}) => {
  const puzzle = await gearPuzzle(false);
  await openPuzzle(page, puzzle);

  await crankTo(page, puzzle.crank);
  await scrubToConvergence(page, puzzle.convergence);
  await expect(page.getByTestId("seeing-count")).toHaveText("1");
  await accuse(page, puzzle);
});

test("fix the diagram: swap the starting slots, then crank, scrub and accuse", async ({
  page,
}) => {
  const puzzle = await gearPuzzle(true);
  await openPuzzle(page, puzzle);

  const panel = page.getByTestId("swap-panel");
  await expect(async () => {
    for (const { a, b } of puzzle.swaps) {
      await panel.locator(`[data-gear-button="${a}"]`).click();
      await panel.locator(`[data-gear-button="${b}"]`).click();
    }
    await expect(page.getByTestId("adjustments")).toHaveText(
      `Adjustments: ${puzzle.swaps.length}/${puzzle.swaps.length}`,
      { timeout: 1000 },
    );
  }).toPass({ timeout: 15_000 });

  await crankTo(page, puzzle.crank);
  await scrubToConvergence(page, puzzle.convergence);
  await expect(page.getByTestId("seeing-count")).toHaveText("1");
  await accuse(page, puzzle);
});
