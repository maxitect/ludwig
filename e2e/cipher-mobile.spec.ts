import { expect, test, type Locator, type Page } from "@playwright/test";
import { content as caesarContent } from "../content/caesar/notebook-margin";
import { content as pictogramContent } from "../content/pictogram-cipher/pin-men";
import { pictogramGlyphs } from "../content/lookups";
import { lettersOf } from "../src/puzzles/_shared/cipher-key/cipher-key";
import { deriveCiphertext } from "../src/puzzles/caesar/derive";
import { checkSolved, openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => !isMobile, "touch phones only");

const pad = (page: Page) => page.getByRole("group", { name: "Keyboard" });
const ciphertext = (page: Page) => page.getByTestId("ciphertext");

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

async function expectLayout(page: Page, name: string) {
  await expect(pad(page)).toBeVisible();
  const viewport = page.viewportSize()!;
  const text = await box(ciphertext(page));
  const strip = await box(page.getByRole("group", { name: "Cipher key" }));
  const keys = await box(pad(page));
  expect(text.y).toBeGreaterThanOrEqual(0);
  expect(text.x + text.width).toBeLessThanOrEqual(viewport.width);
  expect(text.y + text.height).toBeLessThanOrEqual(strip.y);
  expect(strip.y + strip.height).toBeLessThanOrEqual(keys.y);
  expect(keys.y + keys.height).toBeLessThanOrEqual(viewport.height);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({ path: `.verification/T116/${name}-${scheme}.png` });
  }
}

test("a caesar cipher is solved by tapping, ciphertext in view throughout", async ({
  page,
}) => {
  const { plaintext, shift } = caesarContent;
  await openPuzzle(page, { typeKey: "caesar", slug: "notebook-margin" });
  await expectLayout(page, "caesar");

  const cipher = lettersOf(deriveCiphertext(plaintext, shift));
  const plain = lettersOf(plaintext);
  const pairs = new Map([...cipher].map((letter, i) => [letter, plain[i]]));
  for (const [cipherLetter, plainLetter] of pairs) {
    await page
      .getByRole("textbox", {
        name: new RegExp(`^Cipher letter ${cipherLetter.toUpperCase()},`),
      })
      .tap();
    await pad(page)
      .getByRole("button", { name: plainLetter.toUpperCase(), exact: true })
      .tap();
    await expect(ciphertext(page)).toBeInViewport({ ratio: 1 });
  }
  await checkSolved(page);
  await expect(page.getByTestId("solved-stamp")).toContainText("Solved.");
});

test("a pictogram cipher is solved by tapping, ciphertext in view throughout", async ({
  page,
}) => {
  const numberOf = Object.fromEntries(
    pictogramGlyphs.map(({ assetKey, letter }) => [
      letter,
      Number(assetKey.slice("glyph-".length)),
    ]),
  );
  const toGuess = [...new Set(pictogramContent.plaintext.replace(/ /g, ""))]
    .filter((letter) => !pictogramContent.given.includes(letter))
    .sort((a, b) => numberOf[a] - numberOf[b]);
  await openPuzzle(page, { typeKey: "pictogram-cipher", slug: "pin-men" });
  await expectLayout(page, "pictogram");

  for (const letter of toGuess) {
    await page
      .getByRole("textbox", {
        name: new RegExp(`^Symbol ${numberOf[letter]},`),
      })
      .tap();
    await pad(page)
      .getByRole("button", { name: letter.toUpperCase(), exact: true })
      .tap();
    await expect(ciphertext(page)).toBeInViewport({ ratio: 1 });
  }
  await checkSolved(page);
  await expect(page.getByTestId("solved-stamp")).toContainText("Solved.");
});
