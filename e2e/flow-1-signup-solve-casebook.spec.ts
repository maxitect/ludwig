import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { quickCrosswordPuzzle } from "./helpers/content";
import { attemptsFor, databaseAvailable } from "./helpers/db";
import { checkSolved, fillCrossword, openPuzzle } from "./helpers/solve";

test("sign up, solve a quick crossword and see it in the Casebook", async ({
  page,
}) => {
  const email = uniqueEmail("flow1");
  const crossword = await quickCrosswordPuzzle();

  await signUp(page, email);
  await openPuzzle(page, crossword);
  await fillCrossword(page, crossword.cells);
  await checkSolved(page);

  await page.goto("/casebook");
  await expect(
    page.getByRole("link", { name: new RegExp(crossword.title) }),
  ).toBeVisible();

  if (databaseAvailable) {
    expect(await attemptsFor(email)).toEqual([
      { typeKey: "crossword", slug: crossword.slug, completed: true },
    ]);
  }
});
