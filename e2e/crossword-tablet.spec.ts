import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  firstPublishedSlug,
  futoshikiPuzzle,
  kakuroPuzzle,
  quickCrosswordPuzzle,
  sudokuPuzzle,
} from "./helpers/content";
import { crosswordCell, openPuzzle } from "./helpers/solve";

test.skip(
  ({ browserName }) => browserName !== "webkit",
  "touch tablets only (the tablet project)",
);

const SIZES = [
  { name: "portrait-820", width: 820, height: 1180 },
  { name: "portrait-768", width: 768, height: 1024 },
  { name: "portrait-1024", width: 1024, height: 1366 },
  { name: "landscape-1180", width: 1180, height: 820 },
  { name: "landscape-1366", width: 1366, height: 1024 },
];

const MAX_WIDTH = 576;

const bar = (page: Page) => page.getByTestId("clue-bar");
const pad = (page: Page) => page.getByRole("group", { name: "Keyboard" });

type Box = { x: number; y: number; width: number; height: number };

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

const noPageScroll = (page: Page) =>
  page.evaluate(
    () =>
      document.scrollingElement!.scrollHeight === window.innerHeight &&
      document.scrollingElement!.scrollWidth === window.innerWidth,
  );

async function expectCentred(locator: Locator, page: Page, maxWidth = MAX_WIDTH) {
  const found = await box(locator);
  const { width } = page.viewportSize()!;
  expect(found.width).toBeLessThanOrEqual(maxWidth);
  expect(Math.abs(found.x + found.width / 2 - width / 2)).toBeLessThanOrEqual(2);
}

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("crossword: fixed page, clue bar, pad, no system keyboard", async ({
      page,
    }) => {
      const quick = await quickCrosswordPuzzle();
      await openPuzzle(page, quick);
      await expect(pad(page)).toBeVisible();
      await expect(bar(page)).toBeVisible();
      await expect(
        page.locator("input[inputmode=none]").first(),
      ).toBeAttached();
      expect(await noPageScroll(page)).toBe(true);

      for (const cell of quick.cells.slice(0, 3)) {
        await crosswordCell(page, cell).tap();
        await pad(page)
          .getByRole("button", { name: cell.letter, exact: true })
          .tap();
        await expect(bar(page)).toBeInViewport();
        await expect(crosswordCell(page, cell)).toHaveAttribute(
          "aria-label",
          new RegExp(`, ${cell.letter}$`),
        );
      }
      await expect(pad(page)).toBeVisible();
      expect(await noPageScroll(page)).toBe(true);

      const grid = await box(page.getByRole("grid"));
      const keys = await box(pad(page));
      const clue = await box(bar(page));
      const { width, height } = page.viewportSize()!;
      for (const b of [grid, clue, keys]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width);
        expect(b.y + b.height).toBeLessThanOrEqual(height);
      }
      expect(grid.y + grid.height).toBeLessThanOrEqual(clue.y + 1);
      expect(clue.y + clue.height).toBeLessThanOrEqual(keys.y + 1);
      await expectCentred(pad(page), page);
      await expectCentred(bar(page), page);
      await expectCentred(page.getByRole("grid"), page, width);

      for (const scheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.screenshot({
          path: `.verification/T168/crossword-${size.name}-${scheme}.png`,
        });
      }
    });

    test("sudoku: fixed page, digit pad", async ({ page }) => {
      await openPuzzle(page, await sudokuPuzzle());
      await expect(pad(page)).toBeVisible();
      await expect(
        page.locator("input[inputmode=none]").first(),
      ).toBeAttached();
      expect(await noPageScroll(page)).toBe(true);
      const grid = await box(page.getByRole("grid", { name: "Sudoku" }));
      const keys = await box(pad(page));
      expect(grid.y + grid.height).toBeLessThanOrEqual(keys.y);
      await expectCentred(pad(page), page);
      await expectCentred(
        page.getByRole("grid", { name: "Sudoku" }),
        page,
        page.viewportSize()!.width,
      );
      await expectCentred(
        page.getByRole("button", { name: "Check", exact: true }).locator(".."),
        page,
      );
      await page.screenshot({
        path: `.verification/T168/sudoku-${size.name}-light.png`,
      });
    });
  });
}

test.describe("typed solvers use the pad", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  for (const [name, load, grid] of [
    ["futoshiki", futoshikiPuzzle, "Futoshiki"],
    ["kakuro", kakuroPuzzle, "Kakuro"],
  ] as const) {
    test(name, async ({ page }) => {
      await openPuzzle(page, await load());
      await expect(pad(page)).toBeVisible();
      await expect(page.getByRole("grid", { name: grid })).toBeVisible();
      await expect(
        page.locator("input[inputmode=none]").first(),
      ).toBeAttached();
      expect(await noPageScroll(page)).toBe(true);
    });
  }
});

test.describe("other types", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  for (const typeKey of [
    "fillomino",
    "caesar",
    "keyword",
    "pictogram-cipher",
    "book-cipher",
  ]) {
    test(`${typeKey} shows the pad`, async ({ page }) => {
      await openPuzzle(page, { typeKey, slug: await firstPublishedSlug(typeKey) });
      await expect(pad(page)).toBeVisible();
      await expect(
        page.locator("input[inputmode=none]").first(),
      ).toBeAttached();
      expect(await noPageScroll(page)).toBe(true);
    });
  }

  for (const typeKey of ["troix", "word-wheel"]) {
    test(`${typeKey} taps with no system keyboard`, async ({ page }) => {
      await openPuzzle(page, {
        typeKey,
        slug: await firstPublishedSlug(typeKey),
      });
      await expect(
        page.locator("input[inputmode=none]").first(),
      ).toBeAttached();
      expect(await noPageScroll(page)).toBe(true);
    });
  }
});

test.describe("hardware keyboard", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  test("a physical key hides the pad, a tap brings it back, the device keyboard setting hides it for good", async ({
    page,
  }) => {
    const quick = await quickCrosswordPuzzle();
    await openPuzzle(page, quick);
    const [first] = quick.cells;
    await crosswordCell(page, first).tap();
    await expect(pad(page)).toBeVisible();
    await page.keyboard.press(first.letter);
    await expect(pad(page)).toHaveCount(0);
    await expect(crosswordCell(page, first)).toHaveAttribute(
      "aria-label",
      new RegExp(`, ${first.letter}$`),
    );
    await expect(bar(page)).toBeVisible();
    await crosswordCell(page, first).tap();
    await expect(pad(page)).toBeVisible();

    await page.getByRole("button", { name: /menu/i }).tap();
    await page
      .getByRole("menuitemcheckbox", { name: /device's keyboard/i })
      .tap();
    await page.keyboard.press("Escape");
    await crosswordCell(page, first).tap();
    await expect(pad(page)).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
    expect(await noPageScroll(page)).toBe(true);
  });
});
