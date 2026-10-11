import { expect, test, type Locator } from "@playwright/test";
import { regionCentre } from "../src/puzzles/spot-difference/regions";
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

test("shows one scene at a time and counts taps in either", async ({ page }) => {
  await openPuzzle(page, puzzle);
  const one = page.getByRole("img", { name: "Scene one" });
  const two = page.getByRole("img", { name: "Scene two" });

  await expect(one).toBeVisible();
  await expect(two).toBeHidden();

  await tapAt(one, regionCentre(differences[0]));
  await expect(page.getByText(`Found 1 of ${differenceCount} differences.`)).toBeVisible();

  await page.getByRole("radio", { name: "Right" }).tap();
  await expect(two).toBeVisible();
  await expect(one).toBeHidden();

  await tapAt(two, regionCentre(differences[1]));
  await expect(page.getByText(`Found 2 of ${differenceCount} differences.`)).toBeVisible();
});
