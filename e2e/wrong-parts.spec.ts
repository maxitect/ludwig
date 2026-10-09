import { expect, test, type Page } from "@playwright/test";
import {
  futoshikiPuzzle,
  logicGridPuzzle,
  sudokuPuzzle,
} from "./helpers/content";
import { clickCheck, openPuzzle } from "./helpers/solve";

type Entry = { row: number; col: number; digit: number };

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

async function fillWithOneMistake(
  page: Page,
  size: number,
  solution: Entry[],
  mistake: Entry,
) {
  for (const { row, col, digit } of solution) {
    const label = await cell(page, row, col).getAttribute("aria-label");
    if (label?.includes("given")) continue;
    const typed =
      row === mistake.row && col === mistake.col ? (digit % size) + 1 : digit;
    await cell(page, row, col).click();
    await page.keyboard.press(String(typed));
  }
}

for (const type of ["sudoku", "futoshiki"] as const) {
  test(`a wrong ${type} names its broken cells and clears on the next edit`, async ({
    page,
  }, testInfo) => {
    const puzzle =
      type === "sudoku"
        ? { ...(await sudokuPuzzle()), size: 9 }
        : await futoshikiPuzzle();
    const { size } = puzzle;
    const given = new Set(puzzle.givens.map(({ row, col }) => `${row},${col}`));
    const mistake = puzzle.solution.find(
      ({ row, col }) => !given.has(`${row},${col}`),
    )!;
    await openPuzzle(page, puzzle);
    await expect(page.getByRole("grid")).toBeVisible();
    await fillWithOneMistake(page, size, puzzle.solution, mistake);
    await clickCheck(page);

    const wrong = page.getByRole("gridcell", { name: /breaks a rule/ });
    await expect(wrong.first()).toBeVisible();
    await expect(cell(page, mistake.row, mistake.col)).toHaveAttribute(
      "aria-label",
      /breaks a rule/,
    );
    await expect(
      page.getByRole("status").filter({ hasText: /marked wrong/ }),
    ).toContainText(/\d+ parts? (is|are) marked wrong/);
    await page.screenshot({
      path: `.verification/T131/${type}-${testInfo.project.name}.png`,
    });

    await cell(page, mistake.row, mistake.col).click();
    await page.keyboard.press("Backspace");
    await expect(wrong).toHaveCount(0);
  });
}

test("a wrong logic grid names its wrong category pairs and clears on the next edit", async ({
  page,
}, testInfo) => {
  const puzzle = await logicGridPuzzle(false);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("grid", { name: "Logic grid" })).toBeVisible();
  const [first, second] = puzzle.households;
  const swapped = [
    [first[0], ...second.slice(1)],
    [second[0], ...first.slice(1)],
    ...puzzle.households.slice(2),
  ];
  const pair = (a: string, b: string) =>
    page.getByRole("gridcell", { name: new RegExp(`^${a} × ${b}: `) });
  for (const row of swapped) {
    for (let a = 0; a < row.length; a++) {
      for (let b = a + 1; b < row.length; b++) {
        const target = pair(row[a], row[b]);
        await target.click();
        await target.click();
      }
    }
  }
  await clickCheck(page);
  const wrong = page.getByRole("gridcell", {
    name: /in a pair of categories that is wrong/,
  });
  await expect(wrong.first()).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: /marked wrong/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `.verification/T131/logic-grid-${testInfo.project.name}.png`,
  });
  await pair(first[0], first[1]).click();
  await expect(wrong).toHaveCount(0);
});
