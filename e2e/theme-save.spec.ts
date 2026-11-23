import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { hydrated } from "./helpers/solve";

test("a signed-in theme save applies at once and survives a reload", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("theme"), "Theme Tester");
  await page.goto("/puzzles");
  const account = page.getByRole("button", { name: /Theme Tester/ }).first();
  await hydrated(account);
  await account.click();
  const saved = page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
  await page.getByRole("menuitemradio", { name: "Ink" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
  await saved;
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
});
