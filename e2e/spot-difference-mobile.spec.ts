import { expect, test, type Locator } from "@playwright/test";
import {
  generateScene,
  regionCentre,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "../src/puzzles/spot-difference/engine";
import { content, meta } from "../content/spot-difference/away-day";
import { openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const puzzle = { typeKey: "spot-difference", slug: meta.slug };
const { sceneSeed, differenceCount, generatorVersion } = content;
const { differences } = generateScene(sceneSeed, differenceCount, generatorVersion);

async function tapAt(scene: Locator, point: { x: number; y: number }) {
  const box = await scene.boundingBox();
  if (!box) throw new Error("scene not rendered");
  await scene.tap({
    position: {
      x: (point.x / SCENE_WIDTH) * box.width,
      y: (point.y / SCENE_HEIGHT) * box.height,
    },
  });
}

test("shows one scene at a time and counts taps in either", async ({ page }) => {
  await openPuzzle(page, puzzle);
  const one = page.getByRole("img", { name: "Scene one" });
  const two = page.getByRole("img", { name: "Scene two" });

  await expect(one).toBeVisible();
  await expect(two).toBeHidden();

  await tapAt(one, regionCentre(differences[0].region));
  await expect(page.getByText(`Found 1 of ${differenceCount} differences.`)).toBeVisible();

  await page.getByRole("radio", { name: "Right" }).tap();
  await expect(two).toBeVisible();
  await expect(one).toBeHidden();

  await tapAt(two, regionCentre(differences[1].region));
  await expect(page.getByText(`Found 2 of ${differenceCount} differences.`)).toBeVisible();
});
