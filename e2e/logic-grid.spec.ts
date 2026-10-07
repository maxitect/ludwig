import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { logicGridPuzzle } from "./helpers/content";
import { attemptsFor, databaseAvailable, logicGridMarks } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const pair = (page: Page, a: string, b: string) =>
  page.getByRole("gridcell", { name: new RegExp(`^${a} × ${b}: `) });

/** Clicks a cell until it reads yes: blank takes two clicks, no takes one. */
async function markYes(page: Page, a: string, b: string) {
  const target = pair(page, a, b);
  const state = (await target.getAttribute("aria-label"))!.split(": ")[1];
  if (state === "yes") return;
  await target.click();
  if (state === "blank") await target.click();
  await expect(target).toHaveAttribute("aria-label", /: yes$/);
}

async function markHouseholds(page: Page, households: string[][]) {
  for (const row of households) {
    for (let first = 0; first < row.length; first++) {
      for (let second = first + 1; second < row.length; second++) {
        await markYes(page, row[first], row[second]);
      }
    }
  }
}

const check = (page: Page) =>
  page.getByRole("button", { name: "Check", exact: true }).click();

test("a signed-in player's marks persist and the puzzle completes", async ({
  page,
}) => {
  const email = uniqueEmail("lg-classic");
  const puzzle = await logicGridPuzzle(false);
  const [first] = puzzle.households;
  await signUp(page, email);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("grid", { name: "Logic grid" })).toBeVisible();

  await markYes(page, first[0], first[1]);
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers() &&
      (response.request().postData() ?? "").includes('"mark":"no"'),
  );
  await pair(page, first[0], first[2]).click();
  await autosave;
  if (databaseAvailable) {
    await expect
      .poll(async () => logicGridMarks(email))
      .toEqual([
        { mark: "yes", count: 1 },
        { mark: "no", count: 1 },
      ]);
  }
  await page.reload();
  await expect(pair(page, first[0], first[1])).toHaveAttribute(
    "aria-label",
    /: yes$/,
  );
  await expect(pair(page, first[0], first[2])).toHaveAttribute(
    "aria-label",
    /: no$/,
  );

  await markHouseholds(page, puzzle.households);
  await check(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await attemptsFor(email))[0]?.completed)
      .toBe(true);
  }
});

test("the false-statement variant needs the false clue flagged", async ({
  page,
}) => {
  const puzzle = await logicGridPuzzle(true);
  await signUp(page, uniqueEmail("lg-variant"));
  await openPuzzle(page, puzzle);
  await markHouseholds(page, puzzle.households);
  await check(page);
  await expect(
    page.getByText("Finish the puzzle before checking it."),
  ).toBeVisible();
  const wrong = puzzle.falseClue === 1 ? 2 : 1;
  await page.getByRole("radio", { name: `Clue ${wrong}`, exact: true }).check();
  await check(page);
  await expect(page.getByText("Not quite. Keep going.")).toBeVisible();
  await page
    .getByRole("radio", { name: `Clue ${puzzle.falseClue}`, exact: true })
    .check();
  await check(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
});

test("the grid is keyboard-operable and each cell names its pair", async ({
  page,
}) => {
  const puzzle = await logicGridPuzzle(false);
  await openPuzzle(page, puzzle);
  const grid = page.getByRole("grid", { name: "Logic grid" });
  await expect(grid).toBeVisible();
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) break;
  }
  const focused = page.locator('[role="gridcell"]:focus');
  await expect(focused).toHaveCount(1);
  await expect(focused).toHaveAttribute("aria-label", / × .*: blank$/);
  await page.keyboard.press("Space");
  await expect(focused).toHaveAttribute("aria-label", /: no$/);
  await page.keyboard.press("Space");
  await expect(focused).toHaveAttribute("aria-label", /: yes$/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(grid.getByRole("gridcell", { name: /: no$/ })).toHaveCount(2);
  await expect(grid.getByRole("gridcell", { name: /: yes$/ })).toHaveCount(1);

  const [person, , last] = puzzle.households[puzzle.households.length - 1];
  const clicked = pair(page, person, last);
  await clicked.click();
  await expect(clicked).toBeFocused();
  await page.keyboard.press("Space");
  await expect(clicked).toHaveAttribute("aria-label", /: yes$/);
});

test("the page never scrolls sideways", async ({ page }) => {
  const puzzle = await logicGridPuzzle(false);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("grid", { name: "Logic grid" })).toBeVisible();
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});
