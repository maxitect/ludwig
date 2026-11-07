import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { firstPublishedSlug } from "./helpers/content";
import { databaseAvailable, setPublishedAt } from "./helpers/db";
import { hydrated } from "./helpers/solve";

const favourite = (page: Page) =>
  page.getByRole("button", { name: "Favourite" }).first();

const isPost = (response: { request(): { method(): string } }) =>
  response.request().method() === "POST";

/** Opens the type page and waits out the visit it records, so the next POST seen is the toggle's. */
async function visitTroix(page: Page) {
  const visited = page.waitForResponse(isPost);
  await page.goto("/puzzles/troix");
  await hydrated(favourite(page));
  await visited;
}

async function toggle(page: Page, pressed: "true" | "false") {
  const saved = page.waitForResponse(isPost);
  await favourite(page).click();
  await saved;
  await expect(favourite(page)).toHaveAttribute("aria-pressed", pressed);
}

const collectionCard = (page: Page) =>
  page
    .getByRole("listitem")
    .filter({ hasText: "Troix" })
    .getByRole("button", { name: "Favourite" });

test("signed out, Favourite sends you to sign in and back", async ({ page }) => {
  await page.goto("/puzzles/troix");
  await page.getByRole("link", { name: "Favourite" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=\/puzzles\/troix$/);
});

test("a favourite shows on the Collection and the Desk, and clears everywhere", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("favourites"));
  await visitTroix(page);
  await toggle(page, "true");

  await page.goto("/puzzles");
  await expect(collectionCard(page)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  const shelf = page.getByRole("region", { name: "Your favourites" });
  await expect(shelf.getByRole("link", { name: "Troix" })).toBeVisible();
  const headings = await page
    .getByRole("heading", { level: 2 })
    .allTextContents();
  expect(headings.slice(0, 2).map((h) => h.toLowerCase())).toEqual([
    "continue",
    "your favourites",
  ]);

  await visitTroix(page);
  await toggle(page, "false");
  await page.goto("/puzzles");
  await expect(collectionCard(page)).toHaveAttribute("aria-pressed", "false");
  await page.goto("/");
  await expect(shelf.getByRole("link", { name: "Troix" })).toHaveCount(0);
});

test("the Desk counts puzzles published since the last visit", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const slug = await firstPublishedSlug("troix");
  await signUp(page, uniqueEmail("visits"));
  await visitTroix(page);
  await toggle(page, "true");

  const previous = await setPublishedAt("troix", slug, null);
  try {
    await page.goto("/");
    const shelf = page.getByRole("region", { name: "Your favourites" });
    await expect(shelf).toContainText("1 new since your last visit");

    await visitTroix(page);
    await page.goto("/");
    await expect(shelf).toContainText("0 new since your last visit");
  } finally {
    await setPublishedAt("troix", slug, previous);
  }
});
