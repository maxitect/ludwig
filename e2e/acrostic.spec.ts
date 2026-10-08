import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { acrosticAttemptFor, databaseAvailable } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const puzzle = { typeKey: "acrostic", slug: "cold-coffee" };

test("a keyboard-only solve is saved and recorded", async ({
  page,
}, info) => {
  const email = uniqueEmail("acrostic");
  await signUp(page, email);
  await openPuzzle(page, puzzle);
  const input = page.getByRole("textbox", { name: "The hidden message" });
  await expect(input).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(input).toBeFocused();

  await page.keyboard.type("i hate you");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Solved in/)).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const shot = `.verification/T050/${info.project.name}`;
  await page.screenshot({ path: `${shot}-paper.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "ink"),
  );
  await page.screenshot({ path: `${shot}-ink.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "paper"),
  );

  const saved = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "POST" &&
      "next-action" in request.headers() &&
      (request.postData() ?? "").includes("I love you")
    );
  });
  await input.press("ControlOrMeta+a");
  await page.keyboard.type("I love you");
  await saved;
  await page.reload();
  await expect(input).toHaveValue("I love you");

  await input.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Solved in/)).toBeVisible();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await acrosticAttemptFor(email))?.completed)
      .toBe(true);
    expect((await acrosticAttemptFor(email)).answer).toBe("I love you");
  }
});
