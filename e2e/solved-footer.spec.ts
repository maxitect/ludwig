import { expect, test, type Page } from "@playwright/test";
import { anagramPuzzle } from "./helpers/content";
import { checkSolved, openPuzzle, typeAnagram } from "./helpers/solve";

const hole = (page: Page) => page.getByTestId("solved-hole");

async function solve(page: Page) {
  const anagram = await anagramPuzzle();
  await openPuzzle(page, anagram);
  await typeAnagram(page, anagram.letters);
  await checkSolved(page);
}

const solvedAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a): a is CSSAnimation => a instanceof CSSAnimation)
      .map((a) => a.animationName),
  );

for (const theme of ["paper", "ink"]) {
  test(`solved footer hole is round, framed and clear of text (${theme})`, async ({
    page,
  }, info) => {
    await solve(page);
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.waitForTimeout(1000);

    const box = await hole(page).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width - box!.height) / box!.width).toBeLessThan(0.05);
    expect(box!.width % 24).toBeLessThan(1);

    const overlaps = await page.evaluate(() => {
      const holeBox = document
        .querySelector('[data-testid="solved-hole"]')!
        .getBoundingClientRect();
      const footer = document.querySelector("footer")!;
      return [...footer.querySelectorAll("p, a")].map((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.left < holeBox.right &&
          r.right > holeBox.left &&
          r.top < holeBox.bottom &&
          r.bottom > holeBox.top
        );
      });
    });
    expect(overlaps.length).toBeGreaterThan(0);
    expect(overlaps.every((overlap) => !overlap)).toBe(true);

    const { image, gridLine, bookBlue } = await hole(page).evaluate((el) => {
      const resolve = (color: string) => {
        const probe = document.createElement("div");
        probe.style.color = color;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      return {
        image: getComputedStyle(el).backgroundImage,
        gridLine: resolve(
          "color-mix(in oklab, var(--color-grid-blue) 60%, transparent)",
        ),
        bookBlue: resolve("var(--color-book-blue)"),
      };
    });
    expect(image).toContain(gridLine);
    expect(image).not.toContain(bookBlue);

    await page.screenshot({
      path: `.verification/T122/${info.project.name}-${theme}.png`,
      fullPage: true,
    });
  });
}

test("the hole opens before the stamp lands", async ({ page }, info) => {
  await solve(page);
  await page.waitForTimeout(120);
  const state = await page.evaluate(() => {
    const hole = document
      .querySelector('[data-testid="solved-hole"]')!
      .getAnimations()
      .find((a) => a instanceof CSSAnimation);
    const stamp = document.querySelector('[data-testid="solved-stamp"]')!;
    return {
      holeName: hole && (hole as CSSAnimation).animationName,
      holeTime: Number(hole?.currentTime ?? -1),
      stampOpacity: Number(getComputedStyle(stamp).opacity),
    };
  });
  expect(state.holeName).toBe("solved-hole-open");
  expect(state.holeTime).toBeLessThan(300);
  expect(state.stampOpacity).toBeLessThan(0.5);
  await page.screenshot({
    path: `.verification/T122/${info.project.name}-mid-open.png`,
    fullPage: true,
  });
  await expect
    .poll(async () => {
      const stamp = page.getByTestId("solved-stamp");
      return Number(await stamp.evaluate((el) => getComputedStyle(el).opacity));
    })
    .toBe(1);
});

test("reduced motion shows the final state at once", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await solve(page);
  expect(await solvedAnimations(page)).not.toContain("solved-hole-open");
  await page.screenshot({
    path: `.verification/T122/${info.project.name}-reduced.png`,
    fullPage: true,
  });
});
