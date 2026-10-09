import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, napkinMathsAttemptFor } from "./helpers/db";
import { clickCheck } from "./helpers/solve";

const path = "/puzzles/napkin-maths/locker-number";

test("a keyboard solve of the numeric answer is saved and recorded", async ({
  page,
}, info) => {
  const email = uniqueEmail("napkin-maths");
  await signUp(page, email);
  const response = await page.goto(path);
  expect(await response!.text()).not.toMatch(/"answer":"54/);
  const input = page.getByRole("textbox", { name: "Your answer" });
  await expect(input).toHaveAttribute("inputmode", "decimal");
  await expect(page.getByRole("list", { name: "Napkin workings" })).toBeVisible();
  await page.waitForTimeout(1000);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const shot = `.verification/T057/${info.project.name}`;
  await page.screenshot({ path: `${shot}-paper.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "ink"),
  );
  await page.screenshot({ path: `${shot}-ink.png`, fullPage: true });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "paper"),
  );

  await input.focus();
  await page.keyboard.type("55");
  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toHaveCount(0);

  const saved = page.waitForResponse((res) => {
    const request = res.request();
    const body = request.postData() ?? "";
    return (
      request.method() === "POST" &&
      "next-action" in request.headers() &&
      body.includes('{"answer":"54.0"}') &&
      !body.includes('"mode"')
    );
  });
  await input.fill("54.0");
  await saved;
  if (databaseAvailable) {
    await expect
      .poll(async () => (await napkinMathsAttemptFor(email))?.answer)
      .toBe("54.000000");
  }

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(input).toBeDisabled();
  if (databaseAvailable) {
    await expect
      .poll(async () => (await napkinMathsAttemptFor(email))?.completed)
      .toBe(true);
  }
});
