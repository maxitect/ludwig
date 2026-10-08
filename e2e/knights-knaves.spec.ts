import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, knightsKnavesAttemptFor } from "./helpers/db";
import { clickCheck, openPuzzle } from "./helpers/solve";

const puzzle = { typeKey: "knights-knaves", slug: "long-table" };

const choice = (page: Page, name: "Knight" | "Knave", index: number) =>
  page.getByRole("radio", { name, exact: true }).nth(index);

test("keyboard toggles are announced, saved and complete the puzzle", async ({
  page,
}, info) => {
  const email = uniqueEmail("knights-knaves");
  await signUp(page, email);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("group", { name: /Cora/ })).toBeVisible();
  await page.waitForTimeout(1000);

  await choice(page, "Knight", 0).focus();
  await page.keyboard.press("Space");
  await expect(choice(page, "Knight", 0)).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(choice(page, "Knave", 0)).toBeChecked();
  await expect(choice(page, "Knight", 0)).not.toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(choice(page, "Knight", 0)).toBeChecked();

  await choice(page, "Knave", 1).focus();
  await page.keyboard.press("Space");
  await choice(page, "Knight", 2).focus();
  await page.keyboard.press("Space");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const shot = `.verification/T055/${info.project.name}`;
  await page.screenshot({ path: `${shot}-paper.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "ink"),
  );
  await page.screenshot({ path: `${shot}-ink.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "paper"),
  );

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toHaveCount(0);

  const saved = page.waitForResponse((response) => {
    const request = response.request();
    const body = request.postData() ?? "";
    return (
      request.method() === "POST" &&
      "next-action" in request.headers() &&
      body.includes('{"position":2,"role":"knave"}') &&
      !body.includes('"mode"')
    );
  });
  await choice(page, "Knave", 2).focus();
  await page.keyboard.press("Space");
  await saved;
  if (databaseAvailable) {
    await expect
      .poll(async () => (await knightsKnavesAttemptFor(email))?.roles)
      .toEqual(["0:knight", "1:knave", "2:knave"]);
  }
  await page.reload();
  await expect(choice(page, "Knave", 2)).toBeChecked();

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await knightsKnavesAttemptFor(email))?.completed)
      .toBe(true);
  }
});
