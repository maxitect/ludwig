import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { anagramPuzzle, quickCrosswordPuzzle } from "./helpers/content";
import { attemptsFor, databaseAvailable } from "./helpers/db";
import {
  checkSolved,
  expectCellLetter,
  fillCrossword,
  openPuzzle,
  typeAnagram,
} from "./helpers/solve";

const PARTIAL_CELLS = 4;

test("signed-out progress is merged into the new account", async ({ page }) => {
  const email = uniqueEmail("flow2");
  const anagram = await anagramPuzzle();
  const crossword = await quickCrosswordPuzzle();
  const partial = crossword.cells.slice(0, PARTIAL_CELLS);

  await openPuzzle(page, anagram);
  await typeAnagram(page, anagram.letters);
  await checkSolved(page);

  await openPuzzle(page, crossword);
  await fillCrossword(page, partial);
  await page.reload();
  for (const cell of partial) await expectCellLetter(page, cell);

  await signUp(page, email);
  await page.waitForFunction(
    () =>
      !Object.keys(localStorage).some((key) =>
        key.startsWith("ludwig:progress:"),
      ),
  );

  await page.goto("/casebook");
  await expect(
    page.getByRole("link", { name: new RegExp(anagram.title) }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(crossword.title) }),
  ).toHaveCount(0);

  await openPuzzle(page, crossword);
  for (const cell of partial) await expectCellLetter(page, cell);

  if (databaseAvailable) {
    expect(await attemptsFor(email)).toEqual([
      { typeKey: "anagram", slug: anagram.slug, completed: true },
      { typeKey: "crossword", slug: crossword.slug, completed: false },
    ]);
  }
});
