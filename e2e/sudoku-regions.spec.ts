import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { content as colourBars } from "../content/sudoku/colour-bars";
import { content as tornEdges } from "../content/sudoku/torn-edges";
import { solve, unitsFor } from "../src/puzzles/sudoku/engine";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  attemptsFor,
  databaseAvailable,
  sudokuAttemptCounts,
} from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SIZE = 9;
const SHOTS = ".verification/T084";

const variants = [
  { slug: "torn-edges", name: "Jigsaw sudoku", content: tornEdges },
  { slug: "colour-bars", name: "Rainbow sudoku", content: colourBars },
] as const;

for (const { slug, name, content } of variants) {
  test(`solve ${slug}, record it, and look right in both themes`, async ({
    page,
  }, testInfo) => {
    const email = uniqueEmail(`t084-${slug}`);
    const solution = solve(content.givens, unitsFor(content.regions))!;
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
    await page.screenshot({ path: `${SHOTS}/ac6-${slug}-greyscale-${width}.png` });

    await grid.getByRole("gridcell").first().click();
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = grid.locator(
          `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
        );
        if (await cell.getAttribute("aria-label").then((l) => l?.includes("given"))) {
          continue;
        }
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
