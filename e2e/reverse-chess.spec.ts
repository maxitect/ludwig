import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { uncapturePuzzle } from "./helpers/content";
import { attemptsFor, databaseAvailable } from "./helpers/db";
import { openPuzzle, clickCheck } from "./helpers/solve";

const square = (page: Page, name: string) =>
  page.locator(`[role="group"][aria-label^="${name},"]`);

const centre = ({ x, y, width, height }: Box) => ({
  x: x + width / 2,
  y: y + height / 2,
});

type Box = { x: number; y: number; width: number; height: number };

async function touchDrag(page: Page, start: Box, end: Box) {
  const cdp = await page.context().newCDPSession(page);
  const from = centre(start);
  const to = centre(end);
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    point?: { x: number; y: number }) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: point ? [point] : [],
    });
  await touch("touchStart", from);
  for (let step = 1; step <= 10; step += 1) {
    await touch("touchMove", {
      x: from.x + ((to.x - from.x) * step) / 10,
      y: from.y + ((to.y - from.y) * step) / 10,
    });
  }
  await touch("touchEnd");
}

async function mouseDrag(page: Page, start: Box, end: Box) {
  const from = centre(start);
  const to = centre(end);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}

async function dragBackwards(page: Page, from: string, to: string) {
  await page
    .getByRole("application", { name: "Chess board" })
    .scrollIntoViewIfNeeded();
  const source = await square(page, from).boundingBox();
  const target = await square(page, to).boundingBox();
  if (!source || !target) {
    throw new Error(`${from} or ${to} is not on the board`);
  }
  const touch = test.info().project.use.hasTouch;
  await (touch ? touchDrag : mouseDrag)(page, source, target);
}

test("sign up, solve a Reverse Chess uncapture and see it in the Casebook", async ({
  page,
}) => {
  const email = uniqueEmail("flow3");
  const puzzle = await uncapturePuzzle();

  await signUp(page, email);
  await openPuzzle(page, puzzle);
  await expect(page.getByTestId("side-to-move")).toBeVisible();

  await expect(async () => {
    await dragBackwards(page, puzzle.to, puzzle.from);
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled({
      timeout: 1000,
    });
  }).toPass({ timeout: 15_000 });
  const uncaptured = page.getByRole("radio", {
    name: `${puzzle.sideToMove} ${puzzle.uncapture}`,
  });
  await expect(async () => {
    await uncaptured.click();
    await expect(uncaptured).toBeChecked({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });

  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();

  await page.goto("/casebook");
  await expect(
    page.getByRole("link", { name: new RegExp(puzzle.title) }),
  ).toBeVisible();

  if (databaseAvailable) {
    expect(await attemptsFor(email)).toEqual([
      { typeKey: "reverse-chess", slug: puzzle.slug, completed: true },
    ]);
  }
});
