import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/rota/the-building-site";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, rotaAttemptFor } from "./helpers/db";

const URL = "/puzzles/rota/the-building-site";
const unswaps = [...content.solution.swaps].reverse();
const token = (page: Page, name: string) => page.getByTestId(`token-${name}`);
const stack = (page: Page) => page.getByTestId("rota-stack").locator("li");

async function unswap(page: Page, a: string, b: string) {
  await token(page, a).click();
  await token(page, b).click();
}

test("the hub lists The Rota and links to it", async ({ page }) => {
  await page.goto("/reverse-chess");
  const link = page.getByRole("link", { name: "Play The Rota" });
  await expect(link).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mode (A|B|C)/ })).toHaveCount(
    4,
  );
  await link.click();
  await expect(page).toHaveURL(/\/puzzles\/rota$/);
});

test("signed in: the stack persists, the puzzle completes and is recorded", async ({
  page,
}) => {
  const email = uniqueEmail("rota");
  await signUp(page, email);
  await page.goto(URL);
  await unswap(page, unswaps[0].a, unswaps[0].b);
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers(),
  );
  await unswap(page, unswaps[1].a, unswaps[1].b);
  await expect(stack(page)).toHaveCount(2);
  await autosave;
  await page.reload();
  await expect(stack(page)).toHaveCount(2);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(stack(page)).toHaveCount(1);
  await unswap(page, unswaps[1].a, unswaps[1].b);
  for (const { a, b } of unswaps.slice(2)) await unswap(page, a, b);

  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(page.getByTestId("epilogue")).toHaveText(
    `Opening gambit: ${content.solution.instigatorName} insisted on it.`,
  );

  if (databaseAvailable) {
    const attempt = await rotaAttemptFor(email);
    expect(attempt.completed).toBe(true);
    expect(attempt.steps).toEqual([1, 2, 3, 4, 5]);
    expect(attempt.pairs).toEqual(
      content.solution.swaps.map(({ a, b }) => `${a}-${b}`),
    );
  }
});

test("a wrong sequence is not accepted and reveals no gambit", async ({
  page,
}) => {
  await page.goto(URL);
  const [{ a, b }] = unswaps;
  await unswap(page, a, b);
  await unswap(page, a, b);
  for (const step of unswaps) await unswap(page, step.a, step.b);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Not quite. Keep going.")).toBeVisible();
  await expect(page.getByText(/Solved in/)).toHaveCount(0);
  await expect(page.getByTestId("epilogue")).toHaveCount(0);
});

test("keyboard: select, select, Enter to unswap, U to undo, stack announced", async ({
  page,
}) => {
  await page.goto(URL);
  const [{ a, b }] = unswaps;
  await token(page, a).focus();
  await page.keyboard.press("Enter");
  await expect(token(page, a)).toHaveAttribute("aria-pressed", "true");
  await token(page, b).focus();
  await page.keyboard.press("Enter");
  await expect(stack(page)).toHaveCount(1);
  await expect(page.getByTestId("rota-status")).toContainText(
    `Unswapped ${a} and ${b}. Step 1 is on the stack.`,
  );
  await expect(page.getByTestId("rota-stack")).toContainText("Step 1:");
  await page.keyboard.press("u");
  await expect(page.getByTestId("rota-status")).toContainText("Undid step 1");
  await expect(page.getByText("Nothing unswapped yet.")).toBeVisible();
});

test("drag one token onto another unswaps them", async ({ page }) => {
  await page.goto(URL);
  const [{ a, b }] = unswaps;
  await token(page, a).dragTo(token(page, b));
  await expect(stack(page)).toHaveCount(1);
});
