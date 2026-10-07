import { expect, test, type Page } from "@playwright/test";
import { content } from "../content/pictogram-cipher/pin-men";
import { pictogramGlyphs } from "../content/lookups";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, pictogramAttemptFor } from "./helpers/db";

const slug = "pin-men";
const keyOf = Object.fromEntries(
  pictogramGlyphs.map(({ assetKey, letter }) => [letter, assetKey]),
);
const numberOf = (letter: string) => Number(keyOf[letter].slice("glyph-".length));

/** The glyphs of the message in the key's order, each with its letter and whether it is given. */
const slots = [...new Set(content.plaintext.replace(/ /g, ""))]
  .map((letter) => ({
    letter,
    number: numberOf(letter),
    given: content.given.includes(letter),
  }))
  .sort((a, b) => a.number - b.number);
const toGuess = slots.filter(({ given }) => !given);
const MAX_TABS = 80;

/** Tabs from the top of the page until a cipher-key slot holds focus. */
async function tabIntoPanel(page: Page) {
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inPanel = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label")?.startsWith("Symbol "),
    );
    if (inPanel) return;
  }
  throw new Error("The cipher key never received keyboard focus");
}

const slot = (page: Page, number: number) =>
  page.getByRole("textbox", { name: new RegExp(`^Symbol ${number},`) });

test("solve a pictogram cipher with the keyboard, keeping guesses across a reload", async ({
  page,
}) => {
  const email = uniqueEmail("pictogram");
  const glyphRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/glyphs/")) glyphRequests.push(request.url());
  });
  await signUp(page, email);
  const response = await page.goto(`/puzzles/pictogram-cipher/${slug}`);
  const html = (await response?.text()) ?? "";

  await expect(page.getByRole("group", { name: "Cipher key" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Symbol \d+, / })).toHaveCount(
    slots.length,
  );

  for (const { letter, number, given } of slots) {
    await expect(slot(page, number)).toHaveAttribute(
      "aria-label",
      given
        ? `Symbol ${number}, given ${letter.toUpperCase()}`
        : `Symbol ${number}, no guess`,
    );
  }

  const flight = html.replaceAll('\\"', '"');
  const pairOf = (letter: string) => `"assetKey":"${keyOf[letter]}","letter":"${letter}"`;
  for (const { letter, given } of slots) {
    if (given) expect(flight).toContain(pairOf(letter));
    else expect(flight).not.toContain(pairOf(letter));
  }
  expect(html).not.toContain("wait for the whistle");

  const [first, second, third] = toGuess;
  await tabIntoPanel(page);
  await expect(slot(page, first.number)).toBeFocused();
  await page.keyboard.type(first.letter + second.letter + third.letter);
  if (databaseAvailable) {
    await expect
      .poll(async () => (await pictogramAttemptFor(email))?.guesses)
      .toBe(3);
  }

  await page.reload();
  for (const { letter, number } of [first, second, third]) {
    await expect(slot(page, number)).toHaveAttribute(
      "aria-label",
      `Symbol ${number}, guess ${letter.toUpperCase()}`,
    );
  }

  await tabIntoPanel(page);
  await page.keyboard.type(toGuess.map(({ letter }) => letter).join(""));

  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText(/Solved in/)).toBeVisible();

  expect(glyphRequests.length).toBeGreaterThan(0);
  for (const url of glyphRequests) {
    expect(new URL(url).pathname).toMatch(/^\/glyphs\/glyph-\d{2}\.svg$/);
  }

  if (databaseAvailable) {
    await expect
      .poll(async () => (await pictogramAttemptFor(email))?.completed)
      .toBe(true);
    expect((await pictogramAttemptFor(email)).guesses).toBe(toGuess.length);
  }
});
