import { expect, test } from "@playwright/test";
import { PASSWORD, signUp, uniqueEmail } from "./helpers/auth";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

test("signs in with an existing account", async ({ page, context }) => {
  const email = uniqueEmail("sign-in");
  await signUp(page, email);
  await context.clearCookies();

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).tap();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
});
