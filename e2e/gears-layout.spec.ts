import { expect, type Page, test } from "@playwright/test";
import { largestGearPuzzle } from "./helpers/content";

const LAYOUT_BUDGET = 10;
const WINDOW_MS = 5000;
const AFTER_PRESS_MS = 150;

test.skip(
  ({ isMobile }) => !isMobile,
  "the layout guard measures the 390x844 viewport",
);

/** Layouts in the 5 s that start 150 ms after pressing play; the press and hover cost 2 themselves. */
async function layoutsWhilePlaying(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const layouts = async () => {
    const { metrics } = await cdp.send("Performance.getMetrics");
    return metrics.find(({ name }) => name === "LayoutCount")!.value;
  };
  await page.getByRole("slider", { name: "Dance scrubber" }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Play dance" }).click();
  await page.waitForTimeout(AFTER_PRESS_MS);
  const start = await layouts();
  await page.waitForTimeout(WINDOW_MS);
  const count = (await layouts()) - start;
  await expect(page.getByRole("button", { name: "Pause dance" })).toBeVisible();
  return count;
}

test("the largest curated diagram stays under the layout budget while playing", async ({
  page,
}) => {
  const puzzle = await largestGearPuzzle();
  await page.goto(`/puzzles/${puzzle.typeKey}/${puzzle.slug}`);
  const count = await layoutsWhilePlaying(page);
  console.log(
    `layout guard ${puzzle.slug} (${puzzle.gearCount} gears): ${count}`,
  );
  expect(count).toBeLessThan(LAYOUT_BUDGET);
});

test("today's daily stays under the layout budget while playing", async ({
  page,
}) => {
  await page.goto("/gears");
  const daily = page.locator('a[href^="/puzzles/gears/daily-"]').first();
  const undrawn = page.getByText("Today’s diagram hasn’t been drawn yet");
  await expect(daily.or(undrawn)).toBeVisible();
  test.skip(
    await undrawn.isVisible(),
    "today's diagram hasn't been drawn on this deployment",
  );
  const href = (await daily.getAttribute("href"))!;
  await page.goto(href);
  const count = await layoutsWhilePlaying(page);
  console.log(`layout guard ${href}: ${count}`);
  expect(count).toBeLessThan(LAYOUT_BUDGET);
});
