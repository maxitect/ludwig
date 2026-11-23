import { expect, test, type Locator } from "@playwright/test";
import { openPuzzle } from "./helpers/solve";

test.skip(
  ({ browserName }) => browserName !== "webkit",
  "touch tablets only (the tablet project)",
);

async function box(locator: Locator) {
  const found = await locator.first().boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

async function expectBeside(left: Locator, right: Locator) {
  const leftBox = await box(left);
  const rightBox = await box(right);
  expect(rightBox.x).toBeGreaterThanOrEqual(leftBox.x + leftBox.width);
  expect(rightBox.y).toBeLessThan(leftBox.y + leftBox.height);
}

test("portrait: the word search keeps its list beside the grid", async ({
  page,
}) => {
  await openPuzzle(page, { typeKey: "word-search", slug: "long-vacation" });
  const grid = page.getByRole("grid", { name: "Word search grid" });
  await expectBeside(grid, page.getByRole("heading", { name: /^Find \d+ words$/ }));
  const gridBox = await box(grid);
  const statusBox = await box(page.getByTestId("solver").getByRole("status"));
  expect(statusBox.y - (gridBox.y + gridBox.height)).toBeLessThanOrEqual(14);
});

test.describe("landscape: the solvers that split in two still do", () => {
  test.use({ viewport: { width: 1080, height: 810 } });

  test("rota: clues beside the board", async ({ page }) => {
    await openPuzzle(page, { typeKey: "rota", slug: "canteen-queue" });
    await expectBeside(
      page.getByTestId("rota-board"),
      page.getByRole("heading", { name: "Clues" }),
    );
  });

  test("word wheel: found words beside the wheel", async ({ page }) => {
    await openPuzzle(page, { typeKey: "word-wheel", slug: "dead-hours" });
    await expectBeside(
      page.getByRole("group", { name: "Wheel letters" }),
      page.getByTestId("wheel-rating"),
    );
  });

  test("gear train: tray beside the board", async ({ page }) => {
    await openPuzzle(page, { typeKey: "gear-train", slug: "big-wheel" });
    await expectBeside(
      page.getByLabel("Pegboard"),
      page.getByRole("group", { name: "Cog tray" }),
    );
  });

  test("book cipher: references beside the page", async ({ page }) => {
    await openPuzzle(page, { typeKey: "book-cipher", slug: "bowerbird-nest" });
    await expectBeside(
      page.getByRole("region", { name: "Page text" }),
      page.getByRole("heading", { name: "References" }),
    );
  });
});
