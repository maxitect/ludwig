import { expect, test, type Locator, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  largestCrypticCrosswordPuzzle,
  quickCrosswordPuzzle,
} from "./helpers/content";
import { checkSolved, crosswordCell, openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const bar = (page: Page) => page.getByTestId("clue-bar");
const pad = (page: Page) => page.getByRole("group", { name: "Keyboard" });
const clueText = (page: Page) => bar(page).getByRole("button").nth(1);
const next = (page: Page) =>
  bar(page).getByRole("button", { name: "Next clue" });

type Box = { x: number; y: number; width: number; height: number };

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

test("grid, clue bar and pad are all in view without overlap", async ({
  page,
}) => {
  const viewport = page.viewportSize()!;
  for (const puzzle of [
    await largestCrypticCrosswordPuzzle(),
    await quickCrosswordPuzzle(),
  ]) {
    await openPuzzle(page, puzzle);
    await expect(pad(page)).toBeVisible();
    const boxes = [
      await box(page.getByRole("grid")),
      await box(bar(page)),
      await box(pad(page)),
    ];
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width);
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(overlaps(boxes[0], boxes[1])).toBe(false);
    expect(overlaps(boxes[1], boxes[2])).toBe(false);
    expect(overlaps(boxes[0], boxes[2])).toBe(false);
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.screenshot({
        path: `.verification/T115/${puzzle.slug}-${scheme}.png`,
      });
    }
  }
});

test("next walks every entry once and returns to 1 Across", async ({ page }) => {
  const cryptic = await largestCrypticCrosswordPuzzle();
  await openPuzzle(page, cryptic);
  await expect(bar(page)).toContainText("1 Across");
  const seen: string[] = [];
  for (let i = 0; i < cryptic.entries; i++) {
    seen.push((await clueText(page).innerText()).trim());
    await next(page).tap();
  }
  expect(new Set(seen).size).toBe(cryptic.entries);
  await expect(bar(page)).toContainText("1 Across");
  await bar(page).getByRole("button", { name: "Previous clue" }).tap();
  await expect(bar(page)).toContainText("Down");
});

test("tapping the clue text switches direction on a crossing cell", async ({
  page,
}) => {
  await openPuzzle(page, await quickCrosswordPuzzle());
  await expect(bar(page)).toContainText("1 Across");
  await expect(clueText(page)).toBeEnabled();
  await clueText(page).tap();
  await expect(bar(page)).toContainText("1 Down");
  await clueText(page).tap();
  await expect(bar(page)).toContainText("1 Across");
});

test("the clue sheet selects an entry", async ({ page }) => {
  await openPuzzle(page, await quickCrosswordPuzzle());
  await pad(page).getByRole("button", { name: "Clues" }).tap();
  const sheet = page.getByRole("dialog", { name: "Clues" });
  await sheet.getByRole("tab", { name: "down" }).tap();
  const third = sheet.getByRole("tabpanel").getByRole("button").nth(2);
  const number = (await third.innerText()).trim().split(/\s/)[0];
  await third.tap();
  await expect(sheet).toHaveCount(0);
  await expect(bar(page)).toContainText(`${number} Down`);
  expect(
    await page.locator('[role="gridcell"].bg-paper-deep').count(),
  ).toBeGreaterThan(1);
});

test("the clue sheet opens on the active clue", async ({ page }) => {
  await openPuzzle(page, await largestCrypticCrosswordPuzzle());
  await bar(page).getByRole("button", { name: "Previous clue" }).tap();
  await pad(page).getByRole("button", { name: "Clues" }).tap();
  const current = page
    .getByRole("dialog", { name: "Clues" })
    .locator("[aria-current=true]");
  await expect(current).toBeFocused();
  await expect(current).toBeInViewport();
});

test("a crossword is solved by tapping alone", async ({ page }) => {
  const quick = await quickCrosswordPuzzle();
  await openPuzzle(page, quick);
  await expect(pad(page)).toBeVisible();
  await next(page).tap();
  for (const cell of quick.cells) {
    await crosswordCell(page, cell).tap();
    await pad(page)
      .getByRole("button", { name: cell.letter, exact: true })
      .tap();
  }
  await checkSolved(page);
  await expect(page.getByTestId("solved-stamp")).toContainText("Solved.");
});

test("check and reveal cell work from the action row", async ({ page }) => {
  const quick = await quickCrosswordPuzzle();
  await signUp(page, uniqueEmail("crossword-mobile"));
  await openPuzzle(page, quick);
  const [first] = quick.cells;
  const wrong = first.letter === "Q" ? "Z" : "Q";
  await crosswordCell(page, first).tap();
  await pad(page).getByRole("button", { name: wrong, exact: true }).tap();
  await crosswordCell(page, first).tap();
  await pad(page).getByRole("button", { name: "Check cell" }).tap();
  await expect(page.getByRole("status").filter({ hasText: "not right" })).toHaveCount(1);
  await pad(page).getByRole("button", { name: "Reveal cell" }).tap();
  await expect(crosswordCell(page, first)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${first.letter}$`),
  );
});
