import { expect, test, type Page } from "@playwright/test";
import { LINE_WIDTH } from "../src/puzzles/book-cipher/derive";
import { openPuzzle } from "./helpers/solve";

const slugs = [
  "hand-lens",
  "bowerbird-nest",
  "feather-and-ink",
  "fieldwork",
  "pennants-post",
];

const WIDE_LINE = "wow we warm many more women whom we mow awhile".padEnd(
  LINE_WIDTH,
  "m",
);

async function pageCount(page: Page) {
  await page.locator(".book-line").first().waitFor();
  const label = await page
    .getByRole("region", { name: /page \d+ of \d+/ })
    .getAttribute("aria-label");
  return Number(label?.match(/of (\d+)/)?.[1]);
}

function brokenLines(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".book-line")]
      .filter((li) => {
        const text = li.querySelector<HTMLElement>(".book-text")!;
        const tops = new Set(
          [...li.querySelectorAll<HTMLElement>("[data-word]")].map(
            (word) => word.offsetTop,
          ),
        );
        return tops.size > 1 || text.scrollWidth > text.clientWidth;
      })
      .map((li) => li.textContent),
  );
}

test.describe("desktop and tablet widths", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  for (const width of [1280, 1024]) {
    test(`no book line wraps or overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const slug of slugs) {
        await openPuzzle(page, { typeKey: "book-cipher", slug });
        const pages = await pageCount(page);
        const next = page.getByRole("button", { name: "Next page" });
        await page.getByRole("region", { name: /page \d+ of/ }).focus();
        await page.keyboard.press("Home");
        for (let i = 1; i <= pages; i++) {
          expect(await brokenLines(page),`${slug} page ${i}`).toEqual([]);
          if (i < pages) await next.click();
        }
        const fontSize = await page
          .locator(".book-line")
          .first()
          .evaluate((li) =>
            parseFloat(getComputedStyle(li.parentElement!).fontSize),
          );
        expect(fontSize).toBeGreaterThanOrEqual(14);
      }
    });

    test(`a ${LINE_WIDTH}-character line of wide letters fits at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPuzzle(page, { typeKey: "book-cipher", slug: slugs[0] });
      await page.locator(".book-text").first().waitFor();
      const fit = await page.evaluate((text) => {
        const textColumn = document.querySelector<HTMLElement>(".book-text")!;
        const probe = document.createElement("span");
        probe.textContent = text;
        probe.style.cssText =
          "white-space:nowrap;position:absolute;visibility:hidden";
        textColumn.append(probe);
        const measured = probe.getBoundingClientRect().width;
        const available = textColumn.getBoundingClientRect().width;
        probe.remove();
        return { measured, available };
      }, WIDE_LINE);
      expect(fit.measured).toBeLessThanOrEqual(fit.available);
    });
  }
});

test("phones mark and indent every continuation row", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPuzzle(page, { typeKey: "book-cipher", slug: "hand-lens" });
  await page.locator(".book-line").first().waitFor();
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".book-line")].map((li) => {
      const words = [...li.querySelectorAll<HTMLElement>("[data-word]")];
      const left = li.querySelector(".book-text")!.getBoundingClientRect().left;
      const first = words[0].offsetTop;
      const continuations = words.filter((w) => w.offsetTop > first + 2);
      const starts = continuations.filter(
        (w, i) => i === 0 || w.offsetTop > continuations[i - 1].offsetTop + 2,
      );
      return {
        starts: starts.length,
        marked: starts.filter((w) => w.querySelector(".book-turn")).length,
        indented: starts.every((w) => w.getBoundingClientRect().left > left + 2),
      };
    }),
  );
  expect(rows.some((row) => row.starts > 0)).toBe(true);
  for (const row of rows) {
    expect(row.marked).toBe(row.starts);
    expect(row.indented).toBe(true);
  }
});

test("reference answers align and panel titles are display caps", async ({
  page,
}) => {
  await openPuzzle(page, { typeKey: "book-cipher", slug: "hand-lens" });
  await page.locator(".book-line").first().waitFor();
  const boxes = await page
    .getByRole("textbox", { name: /^Word \d+:/ })
    .evaluateAll((inputs) =>
      inputs.map((input) => {
        const { left, width } = input.getBoundingClientRect();
        return { left, width };
      }),
    );
  expect(new Set(boxes.map((box) => box.left)).size).toBe(1);
  expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
  const titles = await page.locator("section h2").evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return { transform: style.textTransform, font: style.fontFamily };
    }),
  );
  expect(titles).toHaveLength(2);
  for (const title of titles) {
    expect(title.transform).toBe("uppercase");
    expect(title.font).toMatch(/josefin/i);
  }
});
