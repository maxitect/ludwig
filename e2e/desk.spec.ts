import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { anagramPuzzle } from "./helpers/content";
import { checkSolved, openPuzzle, typeAnagram } from "./helpers/solve";

test("the Desk lists an unfinished puzzle until it is solved", async ({
  page,
}) => {
  const anagram = await anagramPuzzle();
  await page.goto("/");
  await expect(page.locator(".title-sequence")).toBeVisible();

  await signUp(page, uniqueEmail("desk"));
  await page.goto("/");
  await expect(page.locator(".title-sequence")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Continue", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("Nothing in progress")).toBeVisible();

  await openPuzzle(page, anagram);
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && response.status() === 200,
  );
  await typeAnagram(page, anagram.letters.slice(0, 2));
  await saved;

  await page.goto("/");
  const continuing = page.getByRole("region", { name: "Continue" });
  await expect(
    continuing.getByRole("link", { name: anagram.title }),
  ).toBeVisible();

  await openPuzzle(page, anagram);
  await typeAnagram(page, anagram.letters.slice(2));
  await checkSolved(page);

  await page.goto("/");
  await expect(
    continuing.getByRole("link", { name: anagram.title }),
  ).toHaveCount(0);
  await expect(page.getByText("Nothing in progress")).toBeVisible();
  const stats = page.getByRole("region", { name: "Your stats" });
  await expect(stats.locator("dd").first()).toHaveText("1");
});
