import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/word-ladder/coin-toss";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, wordLadderAttemptFor } from "./helpers/db";
import { openPuzzle, clickCheck } from "./helpers/solve";

const puzzle = { typeKey: "word-ladder", slug: "coin-toss" };
const differentLadder = ["heal", "teal", "tell", "tall"];

async function fillRung(page: Page, rung: number, word: string) {
  await page.getByRole("textbox", { name: `Rung ${rung}, letter 1` }).focus();
  for (let n = 0; n < 5; n++) await page.keyboard.press("Delete");
  await page.keyboard.type(word);
}

const check = (page: Page) =>
  clickCheck(page);

test("a different valid ladder is accepted and saved", async ({ page }) => {
  expect(differentLadder).not.toEqual(content.rungs);
  const email = uniqueEmail("word-ladder");
  await signUp(page, email);
  await openPuzzle(page, puzzle);

  await fillRung(page, 1, "held");
  await fillRung(page, 2, "holl");
  await fillRung(page, 3, "tell");
  await fillRung(page, 4, "tall");
  await expect(page.getByTestId("rung-problem")).toHaveCount(0);
  await check(page);
  const problem = page.getByTestId("rung-problem");
  await expect(problem.first()).toContainText("Not a word we know");
  await expect(
    page.getByRole("textbox", { name: "Rung 2, letter 1" }),
  ).toHaveAttribute("aria-invalid", "true");

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.request().headers()["next-action"] !== undefined &&
      (response.request().postData() ?? "").includes("heal"),
  );
  for (const [i, word] of differentLadder.entries()) {
    await fillRung(page, i + 1, word);
  }
  await saved;
  await page.getByRole("textbox", { name: "Rung 4, letter 1" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Solved in/)).toBeVisible();

  if (databaseAvailable) {
    await expect
      .poll(async () => (await wordLadderAttemptFor(email))?.completed)
      .toBe(true);
    expect((await wordLadderAttemptFor(email)).words).toEqual(differentLadder);
  }
});
