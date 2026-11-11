import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import {
  databaseAvailable,
  notificationSettings,
  unsubscribeToken,
} from "./helpers/db";

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
  page,
}) => {
  for (const url of ["/unsubscribe?token=abc.def", "/unsubscribe"]) {
    await page.goto(url);
    await expect(
      page.getByRole("alert").filter({ hasText: "This link is not valid." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Unsubscribe" }),
    ).toHaveCount(0);
  }
});

test("opening an unsubscribe link changes nothing until the button is pressed, signed out", async ({
  page,
  browser,
}) => {
  test.skip(!databaseAvailable, "needs the app's database and secret");
  const email = uniqueEmail("unsub");
  await signUp(page, email);
  await page.goto("/settings");
  await page.getByLabel("Remind me before my streak breaks").check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").getByText("Saved.")).toBeVisible();

  const signedOut = await browser.newContext();
  const visitor = await signedOut.newPage();
  const response = await visitor.goto(
    `/unsubscribe?token=${await unsubscribeToken(email, "streak")}`,
  );
  expect(response?.status()).toBe(200);
  await expect(visitor.getByText("Stop reminders before your streak breaks?")).toBeVisible();
  expect((await notificationSettings(email)).notifyStreak).toBe(true);

  await visitor.getByRole("button", { name: "Unsubscribe" }).click();
  await expect(visitor).toHaveURL(/\/unsubscribed$/);
  expect((await notificationSettings(email)).notifyStreak).toBe(false);
  await signedOut.close();
});

test("both cron routes refuse a request without the bearer", async ({
  request,
}) => {
  for (const path of ["favourite-digest", "streak-nudge"]) {
    const response = await request.get(`/api/cron/${path}`);
    expect(response.status()).toBe(401);
  }
});
