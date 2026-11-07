import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/rota/the-building-site";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, rotaAttemptFor } from "./helpers/db";
import { clickCheck, openPuzzle } from "./helpers/solve";

const puzzle = { typeKey: "rota", slug: "the-building-site" };
const unswaps = [...content.solution.swaps].reverse();
const token = (page: Page, name: string) => page.getByTestId(`token-${name}`);
const stack = (page: Page) => page.getByTestId("rota-stack").locator("li");

const insisted = content.solution.instigatorName;
const accusation = (page: Page) =>
  page.getByRole("group", { name: "Who insisted on the first swap?" });

async function unswap(page: Page, a: string, b: string) {
  await token(page, a).click();
  await token(page, b).click();
}

test("the hub lists The Rota and links to it", async ({ page }) => {
  await page.goto("/reverse-chess");
  const link = page.getByRole("link", { name: "Play The Rota" });
  await expect(link).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mode (A|B|C|D)/ })).toHaveCount(
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
  await openPuzzle(page, puzzle);
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

  const autosaveAccusation = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers(),
  );
  await accusation(page).getByLabel(insisted).check();
  await autosaveAccusation;
  await page.reload();
  await expect(accusation(page).getByLabel(insisted)).toBeChecked();
  if (databaseAvailable) {
    expect((await rotaAttemptFor(email)).instigator).toBe(insisted);
  }

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  const timeline = page.getByTestId("epilogue").locator("li");
  await expect(timeline).toHaveCount(content.solution.swaps.length + 1);
  await expect(timeline.first()).toContainText(
    content.solution.swaps[0].excuse,
  );
  await expect(timeline.last()).toContainText(
    `${insisted} insisted on the first swap`,
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

test("the right sequence with the wrong accusation is not accepted", async ({
  page,
}) => {
  await openPuzzle(page, puzzle);
  for (const { a, b } of unswaps) await unswap(page, a, b);
  const [{ a, b }] = content.solution.swaps;
  const other = a === insisted ? b : a;
  await accusation(page).getByLabel(other).check();
  await clickCheck(page);
  await expect(page.getByText("Not quite. Keep going.")).toBeVisible();
  await expect(page.getByText(/Solved in/)).toHaveCount(0);
  await expect(page.getByTestId("epilogue")).toHaveCount(0);
});

test("the board marks the hazard zone and a tapped clue highlights its speaker", async ({
  page,
}) => {
  await openPuzzle(page, puzzle);
  await expect(
    page.getByRole("group", { name: "D3, where Hobb was found" }),
  ).toBeVisible();
  await expect(page.getByTestId("rota-brief")).toContainText("D3");
  await page.getByTestId("clue-2").getByRole("button").click();
  await expect(token(page, "Colm")).toHaveAttribute("data-highlighted", "true");
  await token(page, "Bridget").click();
  await expect(token(page, "Colm")).not.toHaveAttribute(
    "data-highlighted",
    "true",
  );
});

test("a wrong sequence is not accepted and reveals no gambit", async ({
  page,
}) => {
  await openPuzzle(page, puzzle);
  const [{ a, b }] = unswaps;
  await unswap(page, a, b);
  await unswap(page, a, b);
  for (const step of unswaps) await unswap(page, step.a, step.b);
  await accusation(page).getByRole("radio").first().check();
  await clickCheck(page);
  await expect(page.getByText("Not quite. Keep going.")).toBeVisible();
  await expect(page.getByText(/Solved in/)).toHaveCount(0);
  await expect(page.getByTestId("epilogue")).toHaveCount(0);
});

test("keyboard: select, select, Enter to unswap, U to undo, stack announced", async ({
  page,
}) => {
  await openPuzzle(page, puzzle);
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
  await openPuzzle(page, puzzle);
  const [{ a, b }] = unswaps;
  await token(page, a).dragTo(token(page, b));
  await expect(stack(page)).toHaveCount(1);
});
