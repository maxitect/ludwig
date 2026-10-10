import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { firstPublishedSlug } from "./helpers/content";

const PUZZLE_TYPES = [
  "acrostic",
  "anagram",
  "book-cipher",
  "caesar",
  "cctv-maze",
  "crossword",
  "futoshiki",
  "gear-train",
  "gears",
  "keyword",
  "knights-knaves",
  "logic-grid",
  "napkin-maths",
  "odd-one-out",
  "pictogram-cipher",
  "reverse-chess",
  "rota",
  "sightlines",
  "spot-difference",
  "sudoku",
  "word-ladder",
  "word-search",
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const THEMES = ["paper", "ink"] as const;

/** Signed-out visitors choose the theme in localStorage; a signed-in account's saved "system" setting follows the colour scheme. */
async function audit(
  page: Page,
  theme: (typeof THEMES)[number],
  path: string,
  signedIn = false,
) {
  if (signedIn) {
    await page.emulateMedia({ colorScheme: theme === "ink" ? "dark" : "light" });
  } else {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
  }
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  if (!signedIn) {
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  const count = (impact: string) =>
    violations.filter((v) => v.impact === impact).length;
  console.log(
    `A11Y ${theme} ${path}: ${count("serious")} serious, ${count("critical")} critical`,
  );
  expect(
    violations
      .filter(({ impact }) => impact === "serious" || impact === "critical")
      .map(({ id, nodes }) => ({
        id,
        targets: nodes.map((n) => n.target.join(" ")),
      })),
  ).toEqual([]);
}

test.describe("axe, signed out", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const theme of THEMES) {
    for (const path of [
      "/",
      "/sign-in",
      "/sign-up",
      "/puzzles",
      "/reverse-chess",
      "/gears",
      "/this-week",
      "/puzzles/sudoku/torn-edges",
      "/puzzles/sudoku/colour-bars",
    ]) {
      test(`${theme} ${path}`, async ({ page }) => audit(page, theme, path));
    }

    for (const type of PUZZLE_TYPES) {
      test(`${theme} /puzzles/${type}`, async ({ page }) =>
        audit(page, theme, `/puzzles/${type}`));
      test(`${theme} /puzzles/${type}/[slug]`, async ({ page }) =>
        audit(
          page,
          theme,
          `/puzzles/${type}/${await firstPublishedSlug(type)}`,
        ));
    }
  }
});

test.describe("axe, signed in", () => {
  for (const theme of THEMES) {
    for (const path of ["/casebook", "/settings"]) {
      test(`${theme} ${path}`, async ({ page }) => {
        await signUp(page, uniqueEmail("a11y"));
        await audit(page, theme, path, true);
      });
    }
  }
});
