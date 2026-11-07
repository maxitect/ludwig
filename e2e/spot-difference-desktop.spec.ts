import { expect, test } from "@playwright/test";
import { regionCentre } from "../src/puzzles/_shared/regions";
import { scenes } from "../src/puzzles/spot-difference/scenes";
import { content, meta } from "../content/spot-difference/fixture-clandon";
import { openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => isMobile, "desktop only");

const puzzle = { typeKey: "spot-difference", slug: meta.slug };
const { width, height } = scenes[content.sceneKey];
const differenceCount = content.differences.length;

test("shows two wide scenes side by side and finds a difference in the altered one", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openPuzzle(page, puzzle);
  const one = page.getByRole("img", { name: "Scene one" });
  const two = page.getByRole("img", { name: "Scene two" });
  await expect(one).toBeVisible();
  await expect(two).toBeVisible();

  const [left, right] = [(await one.boundingBox())!, (await two.boundingBox())!];
  expect(left.width).toBeGreaterThanOrEqual(560);
  expect(right.width).toBeGreaterThanOrEqual(560);
  expect(Math.abs(left.y - right.y)).toBeLessThan(1);
  expect(right.x).toBeGreaterThan(left.x + left.width);

  const centre = regionCentre(content.differences[0]);
  await two.click({
    position: {
      x: (centre.x / width) * right.width,
      y: (centre.y / height) * right.height,
    },
  });
  await expect(
    page.getByText(`Found 1 of ${differenceCount} differences.`),
  ).toBeVisible();
  await expect(page.getByTestId("found-circle")).toHaveCount(2);
});

test("draws the scene as ink on a paper sheet in Ink", async ({ page }) => {
  await openPuzzle(page, puzzle);
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "ink"),
  );
  const colours = await page
    .getByRole("img", { name: "Scene one" })
    .evaluate((scene) => {
      const token = (name: string) => {
        const probe = document.createElement("div");
        probe.style.color = `var(${name})`;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      return {
        mask: getComputedStyle(scene.firstElementChild!).backgroundColor,
        sheet: getComputedStyle(scene.parentElement!).backgroundColor,
        ink: token("--color-ink"),
        paper: token("--color-paper"),
      };
    });
  expect(colours.mask).toBe(colours.ink);
  expect(colours.sheet).toBe(colours.paper);
});

for (const type of ["crossword", "sudoku"]) {
  test(`keeps the ${type} solve page in the reading column`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/puzzles/${type}`);
    await page.locator(`a[href^="/puzzles/${type}/"]`).first().click();
    await page.waitForURL(new RegExp(`/puzzles/${type}/.+`));
    const box = (await page.locator("main").first().boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(768);
  });
}
