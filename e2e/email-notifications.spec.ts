import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, notificationSettings } from "./helpers/db";

test("email opt-ins are off by default and round-trip on /settings", async ({
  page,
}) => {
  const email = uniqueEmail("notify");
  await signUp(page, email);
  await page.goto("/settings");
  const favourites = page.getByLabel(
    "Email me when a favourite type gets a new puzzle",
  );
  const streak = page.getByLabel("Remind me before my streak breaks");
  await expect(favourites).not.toBeChecked();
  await expect(streak).not.toBeChecked();

  await favourites.check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").getByText("Saved.")).toBeVisible();

  await page.reload();
  await expect(favourites).toBeChecked();
  await expect(streak).not.toBeChecked();
  if (databaseAvailable) {
    expect(await notificationSettings(email)).toEqual({
      notifyFavourites: true,
      notifyStreak: false,
      cursorSet: true,
    });
  }
});

test("an unsubscribe link with a bad or missing token is refused", async ({
  request,
}) => {
  for (const url of ["/api/unsubscribe?token=abc.def", "/api/unsubscribe"]) {
    const response = await request.get(url, { maxRedirects: 0 });
    expect(response.status()).toBe(400);
  }
});

test("both cron routes refuse a request without the bearer", async ({
  request,
}) => {
  for (const path of ["favourite-digest", "streak-nudge"]) {
    const response = await request.get(`/api/cron/${path}`);
    expect(response.status()).toBe(401);
  }
});
