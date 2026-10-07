import { expect, test } from "@playwright/test";
import { content } from "../content/pictogram-cipher/pin-men";
import { pictogramGlyphs } from "../content/lookups";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, pictogramAttemptFor } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

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

const slot = (page: import("@playwright/test").Page, number: number) =>
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

  for (const { letter, number, given } of slots.filter(({ given }) => !given)) {
    expect(html).not.toContain(`glyph-${String(number).padStart(2, "0")}","letter":"${letter}"`);
  }
  expect(html).not.toContain("wait for the whistle");

  const [first, second, third, ...rest] = toGuess;
  for (const { letter, number } of [first, second, third]) {
    await slot(page, number).click();
    await page.keyboard.type(letter);
  }
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

  await slot(page, slots[0].number).focus();
  for (const { letter, given } of slots) {
    if (given || [first, second, third].some((glyph) => glyph.letter === letter)) {
      await page.keyboard.press("ArrowRight");
    } else {
      await page.keyboard.type(letter);
    }
  }
  expect(rest.length + 3).toBe(toGuess.length);

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
