import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content, meta } from "../content/detective-scene/fixture-street";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, detectiveSceneAttemptFor } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T091";
const puzzle = { typeKey: "detective-scene", slug: meta.slug };
const { width, height, items } = content;
const COLUMNS = 40;
const ROWS = Math.round((COLUMNS * height) / width);
const SERVER_ROUND_TRIPS = { timeout: 15_000 };

const scene = (page: Page) => page.getByRole("group", { name: "The street scene" });
const layer = (page: Page) => page.getByTestId("scene-layer");
const titleField = (page: Page) =>
  page.getByRole("textbox", { name: /Which title is hidden|Tap the scene/ });

const centre = (index: number) => ({
  x: items[index].x + items[index].width / 2,
  y: items[index].y + items[index].height / 2,
});

async function screenPoint(page: Page, point: { x: number; y: number }) {
  const box = await layer(page).boundingBox();
  if (!box) throw new Error("scene not rendered");
  return {
    x: box.x + (point.x / width) * box.width,
    y: box.y + (point.y / height) * box.height,
  };
}

async function openScene(page: Page) {
  await openPuzzle(page, puzzle);
  await expect(scene(page)).toBeVisible();
  await hydrated(scene(page));
}

async function shoot(page: Page, name: string, viewport: number) {
  mkdirSync(SHOTS, { recursive: true });
  for (const theme of ["paper", "ink"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.screenshot({
      path: `${SHOTS}/ac7-${name}-${theme}-${viewport}.png`,
    });
  }
}

test("solve by keyboard alone through the sector grid, keep the finds across a reload", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "keyboard flow runs on desktop");
  test.skip(!databaseAvailable, "needs the local database");
  test.slow();
  const email = uniqueEmail("t091");
  await signUp(page, email);
  await openScene(page);
  await shoot(page, "start", 1280);

  await scene(page).focus();
  let cursor = { column: COLUMNS / 2, row: Math.floor(ROWS / 2) };
  async function pinAt(index: number) {
    const target = {
      column: Math.floor((centre(index).x / width) * COLUMNS),
      row: Math.floor((centre(index).y / height) * ROWS),
    };
    for (; cursor.column < target.column; cursor.column++) {
      await page.keyboard.press("ArrowRight");
    }
    for (; cursor.column > target.column; cursor.column--) {
      await page.keyboard.press("ArrowLeft");
    }
    for (; cursor.row < target.row; cursor.row++) {
      await page.keyboard.press("ArrowDown");
    }
    for (; cursor.row > target.row; cursor.row--) {
      await page.keyboard.press("ArrowUp");
    }
    await page.keyboard.press("Enter");
    await expect(titleField(page)).toBeFocused();
  }

  await pinAt(0);
  await page.keyboard.type("Taggart");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("scene-status")).toContainText("No match", SERVER_ROUND_TRIPS);
  await expect(page.getByTestId("found-ring")).toHaveCount(0);

  await titleField(page).fill("the sweeney");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Found 1 of 3")).toBeVisible(SERVER_ROUND_TRIPS);
  await expect(page.getByTestId("found-ring")).toHaveCount(1);

  await scene(page).focus();
  await pinAt(1);
  await page.keyboard.type("Starsky and Hutch");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Found 2 of 3")).toBeVisible(SERVER_ROUND_TRIPS);

  await expect
    .poll(() => detectiveSceneAttemptFor(email).then((row) => row?.found))
    .toEqual([0, 1]);
  await page.reload();
  await expect(page.getByText("Found 2 of 3")).toBeVisible(SERVER_ROUND_TRIPS);
  await expect(page.getByTestId("found-ring")).toHaveCount(2, SERVER_ROUND_TRIPS);
  await expect(page.getByRole("list", { name: "Titles" })).toContainText("The Sweeney");
  await shoot(page, "two-found", 1280);

  await openScene(page);
  await scene(page).focus();
  cursor = { column: COLUMNS / 2, row: Math.floor(ROWS / 2) };
  await pinAt(2);
  await page.keyboard.type("Morse");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Solved in/)).toBeVisible(SERVER_ROUND_TRIPS);
  await expect(page.getByTestId("found-ring")).toHaveCount(3);
  await expect
    .poll(() => detectiveSceneAttemptFor(email))
    .toEqual({ found: [0, 1, 2], completed: true });
  await shoot(page, "solved", 1280);
});

test("pan and zoom by touch, and tap a pin on a phone", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "touch phones only");
  await openScene(page);
  await scene(page).scrollIntoViewIfNeeded();
  await shoot(page, "start", 390);

  const client = await page.context().newCDPSession(page);
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    points: { x: number; y: number }[]) =>
    client.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points.map((point, id) => ({ ...point, id })),
    });
  const box = (await scene(page).boundingBox())!;
  const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await touch("touchStart", [
    { x: mid.x - 30, y: mid.y },
    { x: mid.x + 30, y: mid.y },
  ]);
  for (let step = 1; step <= 6; step++) {
    await touch("touchMove", [
      { x: mid.x - 30 - step * 12, y: mid.y },
      { x: mid.x + 30 + step * 12, y: mid.y },
    ]);
  }
  await touch("touchEnd", []);
  const zoomed = Number(await layer(page).getAttribute("data-scale"));
  expect(zoomed).toBeGreaterThan(1.5);

  const before = (await layer(page).boundingBox())!;
  await touch("touchStart", [{ x: mid.x, y: mid.y }]);
  for (let step = 1; step <= 5; step++) {
    await touch("touchMove", [{ x: mid.x + step * 12, y: mid.y }]);
  }
  await touch("touchEnd", []);
  const after = (await layer(page).boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 20);
  await shoot(page, "zoomed", 390);

  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(layer(page)).toHaveAttribute("data-scale", "1");
  const target = await screenPoint(page, centre(0));
  await page.touchscreen.tap(target.x, target.y);
  await expect(page.getByTestId("pin")).toBeVisible();
  await titleField(page).fill("Sweeney");
  await page.getByRole("button", { name: "Try it" }).click();
  await expect(page.getByText("Found 1 of 3")).toBeVisible(SERVER_ROUND_TRIPS);
  await shoot(page, "found", 390);
});

test("reveal lists every title and ring", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop only");
  await openScene(page);
  await page.getByRole("button", { name: "Reveal" }).click();
  await expect(page.getByTestId("revealed-ring")).toHaveCount(3, SERVER_ROUND_TRIPS);
  await expect(page.getByRole("list", { name: "Titles" })).toContainText("Inspector Morse");
});

test("the solve page and payload carry no titles, aliases or regions", async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop only");
  const response = await request.get(`/puzzles/${puzzle.typeKey}/${puzzle.slug}`);
  const html = await response.text();
  for (const { title, aliases } of items) {
    expect(html).not.toContain(title.replace("&", "&amp;"));
    for (const alias of aliases) expect(html).not.toContain(alias);
  }
  expect(html).not.toMatch(/"x":\d+,"y":\d+,"width"/);
});
