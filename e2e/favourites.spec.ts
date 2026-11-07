import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { firstPublishedSlug } from "./helpers/content";
import {
  databaseAvailable,
  restorePublishedAt,
  setPublishedAt,
} from "./helpers/db";
import { hydrated } from "./helpers/solve";

const favourite = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Favourite" }).first();

test("signed out, Favourite sends you to sign in and back", async ({ page }) => {
  await page.goto("/puzzles/troix");
  await page.getByRole("link", { name: "Favourite" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpuzzles%2Ftroix$/);
});

test("a favourite shows on the Collection and the Desk, and clears everywhere", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("favourites"));
  await page.goto("/puzzles/troix");
  await hydrated(favourite(page));
  await favourite(page).click();
  await expect(favourite(page)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/puzzles");
  const card = page.getByRole("listitem").filter({ hasText: "Troix" });
  await expect(
    card.getByRole("button", { name: "Favourite" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  const shelf = page.getByRole("region", { name: "Your favourites" });
  await expect(shelf.getByRole("link", { name: "Troix" })).toBeVisible();
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings.slice(0, 2).map((h) => h.toLowerCase())).toEqual([
    "continue",
    "your favourites",
  ]);

  await page.goto("/puzzles/troix");
  await hydrated(favourite(page));
  await favourite(page).click();
  await expect(favourite(page)).toHaveAttribute("aria-pressed", "false");
  await page.goto("/puzzles");
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Troix" })
      .getByRole("button", { name: "Favourite" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.goto("/");
  await expect(
    page
      .getByRole("region", { name: "Your favourites" })
      .getByRole("link", { name: "Troix" }),
  ).toHaveCount(0);
});

test("the Desk counts puzzles published since the last visit", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const slug = await firstPublishedSlug("troix");
  await signUp(page, uniqueEmail("visits"));

  const visited = page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
  await page.goto("/puzzles/troix");
  await hydrated(favourite(page));
  await favourite(page).click();
  await expect(favourite(page)).toHaveAttribute("aria-pressed", "true");
  await visited;

  const previous = await setPublishedAt("troix", slug, "now()");
  try {
    await page.goto("/");
    const shelf = page.getByRole("region", { name: "Your favourites" });
    await expect(shelf).toContainText("1 new since your last visit");

    const recorded = page.waitForResponse(
      (response) => response.request().method() === "POST",
    );
    await page.goto("/puzzles/troix");
    await recorded;
    await page.goto("/");
    await expect(shelf).toContainText("0 new since your last visit");
  } finally {
    await restorePublishedAt("troix", slug, previous);
  }
});
