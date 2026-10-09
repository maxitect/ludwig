import { expect, test, type Locator, type Page } from "@playwright/test";
import { openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const pad = (page: Page) => page.getByRole("group", { name: "Keyboard" });
const bar = (page: Page) => page.getByTestId("reference-bar");
const bookPage = (page: Page) =>
  page.getByRole("region", { name: /page \d+ of \d+/ });

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

test("references are answered by tapping, with the page in view", async ({
  page,
}) => {
  await openPuzzle(page, { typeKey: "book-cipher", slug: "hand-lens" });
  await expect(pad(page)).toBeVisible();
  await expect(bar(page)).toBeVisible();
  await expect(bookPage(page)).toBeInViewport({ ratio: 1 });

  const viewport = page.viewportSize()!;
  const book = await box(bookPage(page));
  const reference = await box(bar(page));
  const keys = await box(pad(page));
  expect(book.y).toBeGreaterThanOrEqual(0);
  expect(book.y + book.height).toBeLessThanOrEqual(reference.y);
  expect(reference.y + reference.height).toBeLessThanOrEqual(keys.y);
  expect(keys.y + keys.height).toBeLessThanOrEqual(viewport.height);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({
      path: `.verification/T116/book-cipher-${scheme}.png`,
    });
  }

  await expect(bar(page)).toContainText("1/");
  await bar(page).getByRole("button", { name: "Next reference" }).tap();
  await bar(page).getByRole("button", { name: "Next reference" }).tap();
  await expect(bar(page)).toContainText("3/");
  await expect(bookPage(page)).toBeInViewport({ ratio: 1 });
  for (const letter of "CAT") {
    await pad(page).getByRole("button", { name: letter, exact: true }).tap();
    await expect(bookPage(page)).toBeInViewport({ ratio: 1 });
  }
  await expect(bar(page)).toContainText("cat");
  await pad(page).getByRole("button", { name: "Delete" }).tap();
  await expect(bar(page)).toContainText("ca");
  await expect(bar(page)).not.toContainText("cat");
  await expect(page.getByRole("textbox", { name: /^Word 3:/ })).toHaveValue(
    "ca",
  );
  await expect(page.getByRole("textbox", { name: /^Word 1:/ })).toHaveValue("");
});
