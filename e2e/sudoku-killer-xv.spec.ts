import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { content as cageMatch } from "../content/sudoku/cage-match";
import { content as deadSum } from "../content/sudoku/dead-sum";
import { content as romanNumerals } from "../content/sudoku/roman-numerals";
import { content as safeHouse } from "../content/sudoku/safe-house";
import { content as xMarks } from "../content/sudoku/x-marks-the-spot";
import { solve, unitsFor, variantFor } from "../src/puzzles/sudoku/engine";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  attemptsFor,
  databaseAvailable,
  sudokuAttemptCounts,
} from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SIZE = 9;
const SHOTS = ".verification/T093";

const variants = [
  { slug: "cage-match", name: "Killer sudoku", content: cageMatch },
  { slug: "dead-sum", name: "Killer sudoku", content: deadSum },
  { slug: "safe-house", name: "Killer sudoku", content: safeHouse },
  { slug: "x-marks-the-spot", name: "XV sudoku", content: xMarks },
  { slug: "roman-numerals", name: "XV sudoku", content: romanNumerals },
] as const;

for (const { slug, name, content } of variants) {
  test(`solve ${slug}, record it, and look right in both themes`, async ({
    page,
  }, testInfo) => {
    const email = uniqueEmail(`t093-${slug}`);
    const cages = "cages" in content ? content.cages : undefined;
    const xv = "xv" in content ? content.xv : undefined;
    const solution = solve(
      content.givens,
      unitsFor(undefined),
      variantFor({ cages, xv }),
    )!;
    await signUp(page, email);
    await openPuzzle(page, { typeKey: "sudoku", slug });
    const grid = page.getByRole("grid", { name });
    await expect(grid).toBeVisible();

    mkdirSync(SHOTS, { recursive: true });
    const width = testInfo.project.name === "mobile" ? 390 : 1280;
    for (const theme of ["paper", "ink"]) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        theme,
      );
      await page.screenshot({
        path: `${SHOTS}/ac6-${slug}-${theme}-${width}.png`,
      });
    }
    await page.addStyleTag({
      content: "html { filter: grayscale(1) !important; }",
    });
    await page.screenshot({
      path: `${SHOTS}/ac6-${slug}-greyscale-${width}.png`,
    });

    await grid.getByRole("gridcell").first().click();
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = grid.locator(
          `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
        );
        const label = await cell.getAttribute("aria-label");
        if (label?.includes("given")) continue;
        await cell.click();
        await page.keyboard.press(String(solution[row * SIZE + col].digit));
      }
    }
    await expect(page.getByText(/Solved in/)).toBeVisible();
    if (databaseAvailable) {
      await expect
        .poll(async () => (await attemptsFor(email))[0]?.completed)
        .toBe(true);
      expect((await sudokuAttemptCounts(email)).cells).toBe(
        81 - content.givens.length,
      );
    }
  });
}
