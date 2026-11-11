import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  completeAttemptFor,
  databaseAvailable,
  publishedPuzzles,
  seedAttemptsFor,
} from "./helpers/db";
import { hydrated } from "./helpers/solve";

const shelf = (page: Page) =>
  page.getByRole("region", { name: "Recommended for you" });

const cards = (page: Page) => shelf(page).getByRole("listitem");

const shelfTypes = async (page: Page) =>
  (
    await shelf(page)
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
  ).map((href) => href!.split("/")[2]);

const isPost = (response: { request(): { method(): string } }) =>
  response.request().method() === "POST";

test("a new player sees six popular starts at difficulty 1 or 2", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("recommend-cold"));
  await page.goto("/");
  await expect(cards(page)).toHaveCount(6);
  await expect(shelf(page)).toContainText("Popular starts");
  for (const card of await cards(page).all()) {
    await expect(card).toContainText("Popular start");
    const label = await card
      .getByRole("img", { name: /^Difficulty \d of 5$/ })
      .getAttribute("aria-label");
    expect(Number(label?.match(/\d/)?.[0])).toBeLessThanOrEqual(2);
  }
});

test("a favourite type is recommended with its reason, and a solved puzzle drops off the shelf", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("recommend-fav");
  await signUp(page, email);

  const visited = page.waitForResponse(isPost);
  await page.goto("/puzzles/troix");
  const favourite = page.getByRole("button", { name: "Favourite" }).first();
  await hydrated(favourite);
  await visited;
  const saved = page.waitForResponse(isPost);
  await favourite.click();
  await saved;
  await expect(favourite).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  const first = cards(page).first();
  await expect(first).toContainText("Because you favourited Troix");
  const href = await first.getByRole("link").getAttribute("href");
  const [, , typeKey, slug] = href!.split("/");
  expect(typeKey).toBe("troix");

  const published = await publishedPuzzles();
  const hrefs = await shelf(page).getByRole("link").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  for (const link of hrefs) {
    const [, , type, puzzleSlug] = link!.split("/");
    const row = published.find((p) => p.typeKey === type && p.slug === puzzleSlug);
    expect(row, link!).toBeDefined();
    expect(row!.daily, link!).toBe(false);
  }

  await completeAttemptFor(email, typeKey, slug);
  await page.reload();
  await expect(shelf(page).locator(`a[href="${href}"]`)).toHaveCount(0);
});

test("three unfinished attempts rank a type below an untried type of its category", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("recommend-unfinished");
  await signUp(page, email);
  await seedAttemptsFor(email, "kakuro", [
    { startedDaysAgo: 1 },
    { startedDaysAgo: 1 },
    { startedDaysAgo: 1 },
  ]);

  await page.goto("/");
  await expect(cards(page).first()).toContainText("Something new in Numbers");
  const types = await shelfTypes(page);
  expect(types[0]).toBe("napkin-maths");
  const kakuro = types.indexOf("kakuro");
  expect(kakuro === -1 || kakuro > types.indexOf("napkin-maths")).toBe(true);
});

test("a type returned to on five days ranks above one tried once", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("recommend-comeback");
  await signUp(page, email);
  await seedAttemptsFor(email, "fillomino", [
    { startedDaysAgo: 10, savedDaysAgo: 8, completedDaysAgo: 6 },
    { startedDaysAgo: 7, savedDaysAgo: 4, completedDaysAgo: 1 },
  ]);
  await seedAttemptsFor(email, "futoshiki", [
    { startedDaysAgo: 10 , completedDaysAgo: 10 },
    { startedDaysAgo: 10, completedDaysAgo: 10 },
  ]);

  await page.goto("/");
  await expect(cards(page).first()).toContainText(
    "You keep coming back to Fillomino",
  );
  const types = await shelfTypes(page);
  expect(types.slice(0, 2)).toEqual(["fillomino", "fillomino"]);
  expect(types.indexOf("futoshiki")).toBeGreaterThan(1);
});
