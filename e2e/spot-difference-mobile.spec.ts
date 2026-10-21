import { expect, test, type Locator } from "@playwright/test";
import { regionCentre } from "../src/puzzles/_shared/regions";
import { scenes } from "../src/puzzles/spot-difference/scenes";
import { content, meta } from "../content/spot-difference/fixture-clandon";
import { openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const puzzle = { typeKey: "spot-difference", slug: meta.slug };
const { differences } = content;
const differenceCount = differences.length;
const { width, height } = scenes[content.sceneKey];

async function tapAt(scene: Locator, point: { x: number; y: number }) {
  const box = await scene.boundingBox();
  if (!box) throw new Error("scene not rendered");
  await scene.tap({
    position: {
      x: (point.x / width) * box.width,
      y: (point.y / height) * box.height,
    },
  });
}

test("stacks both scenes and counts taps in either", async ({ page }) => {
  await openPuzzle(page, puzzle);
  const one = page.getByRole("img", { name: "Scene one" });
  const two = page.getByRole("img", { name: "Scene two" });

  await expect(one).toBeVisible();
  await expect(two).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  const [top, bottom] = [(await one.boundingBox())!, (await two.boundingBox())!];
  expect(bottom.y).toBeGreaterThanOrEqual(top.y + top.height);
  expect(Math.abs(bottom.x - top.x)).toBeLessThan(1);

  await tapAt(one, regionCentre(differences[0]));
  await expect(page.getByText(`Found 1 of ${differenceCount} differences.`)).toBeVisible();

  await tapAt(two, regionCentre(differences[1]));
  await expect(page.getByText(`Found 2 of ${differenceCount} differences.`)).toBeVisible();

  await tapAt(two, regionCentre(differences[0]));
  await expect(page.getByText("Already circled.")).toBeVisible();
  await expect(page.getByTestId("found-circle")).toHaveCount(4);
});
