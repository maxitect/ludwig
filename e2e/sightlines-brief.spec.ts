import { expect, test } from "@playwright/test";
import { content as maze } from "../content/cctv-maze/punt-lane";
import { content as sightlines } from "../content/sightlines/porters-lodge";

test("a sightlines puzzle shows its brief above the grid and names its observers", async ({
  page,
}) => {
  await page.goto("/puzzles/sightlines/porters-lodge");
  const brief = page.getByTestId("puzzle-brief");
  await expect(brief).toHaveText(sightlines.brief);
  const grid = page.getByRole("grid", { name: "Sightlines floor plan" });
  const briefBox = (await brief.boundingBox())!;
  const gridBox = (await grid.boundingBox())!;
  expect(briefBox.y + briefBox.height).toBeLessThanOrEqual(gridBox.y);
  await expect(
    page.getByRole("list", { name: "Observers" }).getByRole("listitem"),
  ).toHaveText([
    "The porter, facing south-west, 120 degrees",
    "The student, facing east, 90 degrees",
    "The delivery driver, facing north-west, 60 degrees",
  ]);
  await expect(
    page.getByRole("gridcell", { name: /^Row 1, column 8, The porter,/ }),
  ).toBeVisible();
});

test("a CCTV maze shows its brief above the grid", async ({ page }) => {
  await page.goto("/puzzles/cctv-maze/punt-lane");
  await expect(page.getByTestId("puzzle-brief")).toHaveText(maze.brief);
});
