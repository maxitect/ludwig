import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { kakuroPuzzle } from "./helpers/content";
import {
  attemptsFor,
  databaseAvailable,
  kakuroAttemptCellCount,
} from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const MAX_TABS = 80;

type Position = { row: number; col: number };

const cell = (page: Page, { row, col }: Position) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Kakuro" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The kakuro grid never received keyboard focus");
}

async function focused(page: Page): Promise<Position> {
  const label = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  const match = /^Row (\d+), column (\d+)/.exec(label ?? "");
  if (!match) throw new Error(`No grid cell has focus: ${label}`);
  return { row: Number(match[1]) - 1, col: Number(match[2]) - 1 };
}

const ARROWS = [
  { key: "ArrowRight", row: 0, col: 1 },
  { key: "ArrowLeft", row: 0, col: -1 },
  { key: "ArrowDown", row: 1, col: 0 },
  { key: "ArrowUp", row: -1, col: 0 },
];

/** Arrow keys skip blocks, so the shortest key sequence is a search over the white cells. */
function route(white: Position[], from: Position, to: Position) {
  const has = (row: number, col: number) =>
    white.some((c) => c.row === row && c.col === col);
  const queue: { at: Position; keys: string[] }[] = [{ at: from, keys: [] }];
  const seen = new Set([`${from.row},${from.col}`]);
  for (const { at, keys } of queue) {
    if (at.row === to.row && at.col === to.col) return keys;
    for (const { key, row, col } of ARROWS) {
      let r = at.row + row;
      let c = at.col + col;
      while (r >= 0 && c >= 0 && r < 20 && c < 20 && !has(r, c)) {
        r += row;
        c += col;
      }
      if (!has(r, c) || seen.has(`${r},${c}`)) continue;
      seen.add(`${r},${c}`);
      queue.push({ at: { row: r, col: c }, keys: [...keys, key] });
    }
  }
  throw new Error("Unreachable cell");
}

test("solve a kakuro with the keyboard only", async ({ page }) => {
  const email = uniqueEmail("kakuro");
  const kakuro = await kakuroPuzzle();

  await signUp(page, email);
  await openPuzzle(page, kakuro);
  await tabIntoGrid(page);

  const first = kakuro.cells[0];
  await expect(cell(page, first)).toHaveAttribute(
    "aria-label",
    /across \d+ over \d+ cells.*down \d+ over \d+ cells/,
  );

  for (const target of kakuro.cells) {
    for (const key of route(kakuro.cells, await focused(page), target)) {
      await page.keyboard.press(key);
    }
    await page.keyboard.press(String(target.digit));
  }

  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await attemptsFor(email))[0]?.completed)
      .toBe(true);
  }
});

test("entries survive a reload", async ({ page }) => {
  const email = uniqueEmail("kakuro-save");
  const kakuro = await kakuroPuzzle();
  const [a] = kakuro.cells;

  await signUp(page, email);
  await openPuzzle(page, kakuro);
  await tabIntoGrid(page);

  await cell(page, a).click();
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers(),
  );
  await page.keyboard.press(String(a.digit));
  await autosave;

  if (databaseAvailable) {
    await expect.poll(() => kakuroAttemptCellCount(email)).toBe(1);
  }
  await page.reload();
  await expect(cell(page, a)).toHaveAttribute(
    "aria-label",
    new RegExp(`, ${a.digit}$`),
  );
});
