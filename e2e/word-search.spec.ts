import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/word-search/long-vacation";
import { derivePlacements } from "../src/puzzles/word-search/derive";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, wordSearchAttemptFor } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const puzzle = { typeKey: "word-search", slug: "long-vacation" };
const cols = content.grid[0].length;
const rows = content.grid.length;
const grid = {
  rows,
  cols,
  cells: content.grid.flatMap((line, row) =>
    [...line].map((letter, col) => ({ row, col, letter })),
  ),
};
const placed = Object.fromEntries(
  derivePlacements(grid, content.words).map(({ word, placements }) => [
    word,
    placements[0],
  ]),
);

const strokes = (page: Page) => page.getByTestId("found-stroke");

type Point = { x: number; y: number };

async function mouseDrag(page: Page, from: Point, to: Point) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

async function touchDrag(page: Page, from: Point, to: Point) {
  const cdp = await page.context().newCDPSession(page);
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    point?: Point,
  ) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: point ? [point] : [],
    });
  await touch("touchStart", from);
  for (let step = 1; step <= 8; step += 1) {
    await touch("touchMove", {
      x: from.x + ((to.x - from.x) * step) / 8,
      y: from.y + ((to.y - from.y) * step) / 8,
    });
  }
  await touch("touchEnd");
  await cdp.detach();
}

async function dragWord(page: Page, word: string) {
  const { start, end } = placed[word];
  const box = (await page.getByRole("grid").boundingBox())!;
  const at = ({ row, col }: { row: number; col: number }) => ({
    x: box.x + ((col + 0.5) / cols) * box.width,
    y: box.y + ((row + 0.5) / rows) * box.height,
  });
  const drag = test.info().project.use.hasTouch ? touchDrag : mouseDrag;
  const before = await strokes(page).count();
  for (let attempt = 0; attempt < 6; attempt++) {
    await drag(page, at(start), at(end));
    try {
      await expect(strokes(page)).toHaveCount(before + 1, { timeout: 1500 });
      return;
    } catch {
      continue;
    }
  }
  await expect(strokes(page)).toHaveCount(before + 1);
}

async function keyWord(page: Page, word: string) {
  const { start, end } = placed[word];
  await page
    .getByRole("gridcell", {
      name: new RegExp(`^Row ${start.row + 1}, column ${start.col + 1},`),
    })
    .focus();
  await page.keyboard.press("Enter");
  const dRow = Math.sign(end.row - start.row);
  const dCol = Math.sign(end.col - start.col);
  const steps = Math.max(
    Math.abs(end.row - start.row),
    Math.abs(end.col - start.col),
  );
  for (let i = 0; i < steps; i++) {
    if (dRow) await page.keyboard.press(dRow > 0 ? "ArrowDown" : "ArrowUp");
    if (dCol) await page.keyboard.press(dCol > 0 ? "ArrowRight" : "ArrowLeft");
  }
  await page.keyboard.press("Enter");
}

test("labels the category The Fob-Off", async ({ page }) => {
  await page.goto("/puzzles");
  await expect(
    page.getByText("The Fob-Off", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/puzzles/word-search");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The Fob-Off",
  );
  await expect(page.getByText(/fob me off with a word search/i)).toBeVisible();
});

test("drag finds words, saves them and completes the puzzle", async ({
  page,
}, info) => {
  const email = uniqueEmail("word-search");
  await signUp(page, email);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("grid")).toBeVisible();
  await page.waitForTimeout(1000);

  const autosave = page.waitForResponse((response) => {
    const body = response.request().postData() ?? "";
    return (
      response.request().method() === "POST" &&
      "next-action" in response.request().headers() &&
      ["GOWN", "QUAD", "TUTOR"].every((word) => body.includes(`"${word}"`))
    );
  });
  await dragWord(page, "GOWN");
  await dragWord(page, "QUAD");
  await dragWord(page, "TUTOR");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const shot = `.verification/T051/${info.project.name}`;
  await page.screenshot({ path: `${shot}-paper.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "ink"),
  );
  await page.screenshot({ path: `${shot}-ink.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "paper"),
  );

  if (databaseAvailable) {
    await expect
      .poll(async () => (await wordSearchAttemptFor(email))?.words.length)
      .toBe(3);
  }
  await autosave;
  await page.reload();
  await expect(strokes(page)).toHaveCount(3);

  await dragWord(page, "PUNT");
  await dragWord(page, "PORTER");
  await dragWord(page, "SCHOLAR");
  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await wordSearchAttemptFor(email))?.completed)
      .toBe(true);
  }
});

test("keyboard selection finds a word", async ({ page }) => {
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("grid")).toBeVisible();
  await page.waitForTimeout(1000);
  await keyWord(page, "PORTER");
  await expect(strokes(page)).toHaveCount(1);
  await expect(page.getByText(/Found PORTER/)).toBeVisible();
});
