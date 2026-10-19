import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as doubleBill } from "../content/star-battle/double-bill";
import { content as firstLight } from "../content/star-battle/first-light";
import { layoutOf, solve } from "../src/puzzles/star-battle/engine";
import type { Content } from "../src/puzzles/star-battle/schema";
import { regionCells } from "../src/puzzles/star-battle/verify";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  attemptsFor,
  databaseAvailable,
  starBattleMarks,
} from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T087";
const MAX_TABS = 80;

const cell = (page: Page, row: number, col: number) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionOf = (content: Content) =>
  (
    solve(
      layoutOf({
        size: content.size,
        stars: content.stars,
        regions: regionCells(content),
      }),
    ) ?? []
  ).map((index) => ({
    row: Math.floor(index / content.size),
    col: index % content.size,
  }));

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Star battle grid" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The star battle grid never received keyboard focus");
}

/** Walks the cursor from (0, 0) with the arrow keys and presses `s` on each star. */
async function placeStars(
  page: Page,
  stars: { row: number; col: number }[],
  at = { row: 0, col: 0 },
) {
  let { row, col } = at;
  for (const star of stars) {
    while (row !== star.row) {
      await page.keyboard.press(row < star.row ? "ArrowDown" : "ArrowUp");
      row += row < star.row ? 1 : -1;
    }
    while (col !== star.col) {
      await page.keyboard.press(col < star.col ? "ArrowRight" : "ArrowLeft");
      col += col < star.col ? 1 : -1;
    }
    await page.keyboard.press("s");
  }
}

test("solve a one-star puzzle by keyboard, keep the marks across a reload", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t087-key");
  const stars = solutionOf(firstLight).sort(
    (a, b) => a.row - b.row || a.col - b.col,
  );
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "star-battle", slug: "first-light" });
  await tabIntoGrid(page);

  await placeStars(page, stars.slice(0, 3));
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press(".");
  await expect(page.getByRole("status").filter({ hasText: "stars placed" })).toHaveText(
    "3 of 6 stars placed",
  );
  await expect
    .poll(async () => starBattleMarks(email))
    .toEqual([
      { mark: "star", count: 3 },
      { mark: "dot", count: 1 },
    ]);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("status").filter({ hasText: "stars placed" })).toHaveText(
    "3 of 6 stars placed",
  );
  await expect(cell(page, stars[0].row, stars[0].col)).toHaveAttribute(
    "aria-label",
    /star/,
  );

  await tabIntoGrid(page);
  await placeStars(page, stars.slice(3), { row: 0, col: 0 });
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect((await starBattleMarks(email)).find((m) => m.mark === "star")?.count).toBe(
    6,
  );
});

test("draws touching stars as wrong, and looks right in both themes", async ({
  page,
}, testInfo) => {
  const stars = solutionOf(doubleBill);
  await openPuzzle(page, { typeKey: "star-battle", slug: "double-bill" });
  const grid = page.getByRole("grid", { name: "Star battle grid" });
  await expect(grid).toBeVisible();

  for (const { row, col } of stars.slice(0, 5)) {
    await cell(page, row, col).click();
    await cell(page, row, col).click();
  }
  const first = stars[0];
  const touching = { row: first.row + 1, col: first.col + 1 };
  await cell(page, touching.row, touching.col).click();
  await cell(page, touching.row, touching.col).click();
  await expect(cell(page, first.row, first.col)).toHaveAttribute(
    "aria-label",
    /breaks a rule/,
  );
  await expect(cell(page, touching.row, touching.col)).toHaveAttribute(
    "aria-label",
    /breaks a rule/,
  );
  await cell(page, 7, 7).click();

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.screenshot({ path: `${SHOTS}/ac7-${theme}-${width}.png` });
  }
});
