import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, oddOneOutAttemptFor } from "./helpers/db";
import { clickCheck } from "./helpers/solve";

const path = "/puzzles/odd-one-out/pit-orchestra";
const explanation = "played by buzzing the lips";

test("the items are a keyboard radio group, saved, and the explanation arrives only after a solve", async ({
  page,
}, info) => {
  const email = uniqueEmail("odd-one-out");
  await signUp(page, email);
  const response = await page.goto(path);
  expect(await response!.text()).not.toContain(explanation);
  const radio = (name: string) => page.getByRole("radio", { name });
  await expect(page.getByRole("group", { name: /odd one out/ })).toBeVisible();
  await page.waitForTimeout(1000);

  await radio("Violin").focus();
  await page.keyboard.press("Space");
  await expect(radio("Violin")).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(radio("Cello")).toBeChecked();
  await expect(radio("Violin")).not.toBeChecked();
  await page.keyboard.press("ArrowUp");
  await expect(radio("Violin")).toBeChecked();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const shot = `.verification/T056/${info.project.name}`;
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
  await expect(page.getByTestId("epilogue")).toHaveCount(0);
  expect(await page.content()).not.toContain(explanation);

  const saved = page.waitForResponse((res) => {
    const request = res.request();
    const body = request.postData() ?? "";
    return (
      request.method() === "POST" &&
      "next-action" in request.headers() &&
      body.includes('{"itemPosition":2}') &&
      !body.includes('"mode"')
    );
  });
  await radio("Trumpet").focus();
  await page.keyboard.press("Space");
  await saved;
  if (databaseAvailable) {
    await expect
      .poll(async () => (await oddOneOutAttemptFor(email))?.itemPosition)
      .toBe(2);
  }
  await page.reload();
  await expect(radio("Trumpet")).toBeChecked();
  expect(await page.content()).not.toContain(explanation);

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(page.getByTestId("epilogue")).toContainText(explanation);
  await expect(radio("Trumpet")).toBeDisabled();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await oddOneOutAttemptFor(email))?.completed)
      .toBe(true);
  }
});
