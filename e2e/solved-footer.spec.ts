import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { anagramPuzzle } from "./helpers/content";
import {
  checkSolved,
  clickCheck,
  openPuzzle,
  typeAnagram,
} from "./helpers/solve";

const hole = (page: Page) => page.getByTestId("solved-hole");

async function typeUnsolved(page: Page) {
  const anagram = await anagramPuzzle();
  await openPuzzle(page, anagram);
  await typeAnagram(page, anagram.letters);
}

async function solve(page: Page) {
  await typeUnsolved(page);
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
    expect(Math.round(box!.width / 24) % 2).toBe(1);
    expect(
      await page.evaluate(() => {
        const footer = document.querySelector("section footer")!;
        return footer.scrollHeight - footer.clientHeight;
      }),
    ).toBe(0);

    const overlaps = await page.evaluate(() => {
      const holeBox = document
        .querySelector('[data-testid="solved-hole"]')!
        .getBoundingClientRect();
      const footer = document.querySelector("section footer")!;
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

test("the stamp lands after the hole opens", async ({ page }) => {
  await typeUnsolved(page);
  const timing = page.evaluate(
    () =>
      new Promise<{ holeEnd: number; stampStart: number }>((resolve) => {
        let holeEnd = 0;
        const watch = () => {
          const hole = document.querySelector('[data-testid="solved-hole"]');
          const stamp = document.querySelector('[data-testid="solved-stamp"]');
          if (hole && !holeEnd) {
            const open = hole
              .getAnimations()
              .find((a) => a instanceof CSSAnimation);
            open?.finished.then(() => (holeEnd = performance.now()));
            holeEnd = open ? -1 : performance.now();
          }
          if (stamp && Number(getComputedStyle(stamp).opacity) > 0) {
            resolve({ holeEnd, stampStart: performance.now() });
            return;
          }
          requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
      }),
  );
  await clickCheck(page);
  const { holeEnd, stampStart } = await timing;
  expect(holeEnd).toBeGreaterThan(0);
  expect(stampStart).toBeGreaterThanOrEqual(holeEnd);
});

test("slowed, the hole is still growing while the stamp is not at rest", async ({
  page,
}, info) => {
  await typeUnsolved(page);
  await page.evaluate(() =>
    new MutationObserver(() =>
      document.getAnimations().forEach((a) => (a.playbackRate = 0.1)),
    ).observe(document.body, { subtree: true, childList: true }),
  );
  await clickCheck(page);
  const wrapper = page.getByTestId("solved-hole").locator("..");
  await page.waitForTimeout(250);
  await wrapper.screenshot({
    path: `.verification/T122/${info.project.name}-mid-open.png`,
  });
  const state = await page.evaluate(() => {
    const open = document
      .querySelector('[data-testid="solved-hole"]')!
      .getAnimations()
      .find((a): a is CSSAnimation => a instanceof CSSAnimation);
    const stamp = document.querySelector('[data-testid="solved-stamp"]')!;
    return {
      name: open?.animationName,
      progress: Number(open?.currentTime ?? 300) / 300,
      stampTransform: getComputedStyle(stamp).transform,
    };
  });
  expect(state.name).toBe("solved-hole-open");
  expect(state.progress).toBeLessThan(1);
  const rest = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.transform = "rotate(-6deg)";
    document.body.append(probe);
    const resolved = getComputedStyle(probe).transform;
    probe.remove();
    return resolved;
  });
  expect(state.stampTransform).not.toBe(rest);
});

async function turnOnReduceMotionSetting(page: Page) {
  await signUp(page, uniqueEmail("t122"));
  await page.goto("/settings");
  await page.getByRole("radio", { name: "On", exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").getByText("Saved.")).toBeVisible();
}

for (const mode of ["os", "setting"]) {
  test(`reduced motion (${mode}) shows the final state at once`, async ({
    page,
  }, info) => {
    if (mode === "os") await page.emulateMedia({ reducedMotion: "reduce" });
    else await turnOnReduceMotionSetting(page);
    await solve(page);
    if (mode === "setting")
      expect(
        await page.evaluate(() =>
          document.documentElement.hasAttribute("data-reduce-motion"),
        ),
      ).toBe(true);
    expect(await solvedAnimations(page)).not.toContain("solved-hole-open");
    await expect(page.getByTestId("solved-stamp")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: `.verification/T122/${info.project.name}-reduced-${mode}.png`,
      fullPage: true,
    });
  });
}
