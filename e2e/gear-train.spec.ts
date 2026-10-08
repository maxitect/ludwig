import { expect, type Page, test } from "@playwright/test";
import { content as bigWheel } from "../content/gear-train/big-wheel";
import { content as firstLink } from "../content/gear-train/first-link";
import { content as lastDeparture } from "../content/gear-train/last-departure";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, gearTrainAttemptFor } from "./helpers/db";
import { clickCheck } from "./helpers/solve";

type Board = { rows: number; cols: number };
type Peg = { row: number; col: number };

const open = (page: Page, slug: string) => page.goto(`/puzzles/gear-train/${slug}`);
const board = (page: Page) => page.getByRole("group", { name: "Pegboard" });
const tray = (page: Page, teeth: number) =>
  page.getByRole("button", { name: new RegExp(`^${teeth}-tooth cog`) });
const status = (page: Page) => page.getByTestId("train-status");
const notice = (page: Page) => page.getByTestId("placement-notice");

/** Taps the middle of a peg. */
async function tap(page: Page, { rows, cols }: Board, { row, col }: Peg) {
  const box = (await board(page).boundingBox())!;
  await page.mouse.click(
    box.x + ((col + 0.5) / cols) * box.width,
    box.y + ((row + 0.5) / rows) * box.height,
  );
}

async function place(
  page: Page,
  size: Board,
  teeth: number,
  peg: Peg,
) {
  await tray(page, teeth).click();
  await tap(page, size, peg);
}

test("the hub shows Mode B after the dancer sections and links to the type", async ({
  page,
}) => {
  await page.goto("/gears");
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  const fix = headings.findIndex((text) => /Fix the Diagram/i.test(text));
  const train = headings.findIndex((text) => /Classic Gear Train/i.test(text));
  expect(fix).toBeGreaterThan(-1);
  expect(train).toBeGreaterThan(fix);
  await expect(
    page.getByRole("heading", { name: "Classic Gear Train", level: 3 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Play Classic Gear Train" }).click();
  await expect(page).toHaveURL(/\/puzzles\/gear-train$/);
});

test("signed in: placed cogs persist across a reload and completion is recorded", async ({
  page,
}) => {
  const email = uniqueEmail("gear-train");
  await signUp(page, email);
  await open(page, "first-link");
  const [cog] = firstLink.solution;
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers() &&
      (response.request().postData() ?? "").includes(`"teeth":${cog.teeth}`),
  );
  await place(page, firstLink, cog.teeth, cog);
  await expect(status(page)).toContainText("Every cog is needed");
  await autosave;
  await page.reload();
  await expect(status(page)).toContainText("Every cog is needed");

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();

  if (databaseAvailable) {
    const attempt = await gearTrainAttemptFor(email);
    expect(attempt.completed).toBe(true);
    expect(attempt.cogs).toEqual([`${cog.row},${cog.col},${cog.teeth}`]);
  }
});

test("a colliding placement is refused and announced", async ({ page }) => {
  await open(page, "first-link");
  await place(page, firstLink, 8, { row: 2, col: 2 });
  await expect(notice(page)).toHaveText(/^Refused\. A 8-tooth cog at C3 would overlap/);
  await expect(notice(page)).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("[data-cog='2,2']")).toHaveCount(0);
  await expect(tray(page, 8)).toContainText("3 left");
});

test("a jammed train shows jam marks and does not turn", async ({ page }) => {
  await open(page, "last-departure");
  await place(page, lastDeparture, 24, { row: 3, col: 6 });
  await place(page, lastDeparture, 16, { row: 6, col: 2 });
  await expect(status(page)).toHaveText("The train is jammed, so nothing turns.");
  await expect(page.locator("[data-jam]")).toHaveCount(3);
  await expect(page.locator(".gear-train-spin")).toHaveCount(0);
});

test("an unneeded cog is named in the status line", async ({ page }) => {
  await open(page, "big-wheel");
  await place(page, bigWheel, 16, bigWheel.solution[0]);
  await expect(status(page)).toContainText("Every cog is needed");
  await place(page, bigWheel, 8, { row: 4, col: 1 });
  await expect(status(page)).toHaveText(
    "The target turns clockwise. Cog at B5 isn't needed.",
  );
  await expect(page.locator(".gear-train-spin").first()).toBeVisible();
});

test("the game is keyboard-operable", async ({ page }) => {
  await open(page, "first-link");
  await tray(page, 8).focus();
  await page.keyboard.press("Enter");
  await expect(tray(page, 8)).toHaveAttribute("aria-pressed", "true");
  await board(page).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(notice(page)).toHaveText(/^Refused\. A 8-tooth cog at C3/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(notice(page)).toHaveText("Placed a 8-tooth cog at D3.");
  await expect(status(page)).toContainText("Every cog is needed");
  await page.keyboard.press("Delete");
  await expect(notice(page)).toHaveText(
    "Returned the 8-tooth cog at D3 to the tray.",
  );
  await expect(status(page)).toContainText("doesn't reach the target yet");
});

test("reduced motion swaps the spin for direction arrows", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "first-link");
  await place(page, firstLink, 8, firstLink.solution[0]);
  await expect(page.locator(".gear-train-spin")).toHaveCount(0);
  await expect(page.locator("[data-cog] path.fill-current")).toHaveCount(3);
});
