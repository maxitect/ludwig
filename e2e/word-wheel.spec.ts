import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { databaseAvailable, wordWheelAttemptFor } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T090";
const puzzle = { typeKey: "word-wheel", slug: "night-wheel" };
const MAX_TABS = 60;

const input = (page: Page) => page.getByRole("textbox", { name: "Your word" });
const message = (page: Page) => page.getByTestId("wheel-message");

async function tabToInput(page: Page) {
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    if (await input(page).evaluate((el) => el === document.activeElement)) {
      return;
    }
  }
  throw new Error("The word field never received keyboard focus");
}

async function play(page: Page, word: string) {
  await input(page).fill(word);
  await page.keyboard.press("Enter");
}

test("solve by keyboard alone, keep the words across a reload", async ({
  page,
}, testInfo) => {
  test.skip(!databaseAvailable, "needs the local database");
  test.slow();
  const email = uniqueEmail("t090");
  await signUp(page, email);
  await openPuzzle(page, puzzle);
  await expect(page.getByRole("group", { name: "Wheel letters" })).toBeVisible();

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  const shoot = async (name: string) => {
    for (const theme of ["paper", "ink"]) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        theme,
      );
      await page.screenshot({
        path: `${SHOTS}/ac6-${name}-${theme}-${width}.png`,
      });
    }
  };
  await shoot("start");

  await tabToInput(page);
  await page.keyboard.type("vent");
  await page.keyboard.press("Enter");
  await expect(message(page)).toContainText("VENT added");

  await play(page, "vude");
  await expect(message(page)).toContainText("Not a word we know");
  await play(page, "tune");
  await expect(message(page)).toContainText("centre");
  await play(page, "vet");
  await expect(message(page)).toContainText("at least 4 letters");
  await play(page, "vent");
  await expect(message(page)).toContainText("Already found");

  await play(page, "venue");
  await expect(message(page)).toContainText("VENUE added");
  await expect
    .poll(async () => (await wordWheelAttemptFor(email))?.words)
    .toEqual(["vent", "venue"]);

  await page.reload();
  await hydrated(page.getByRole("textbox", { name: "Your word" }));
  const found = page.getByRole("list", { name: "Found words" });
  await expect(found).toContainText("vent");
  await expect(found).toContainText("venue");
  await shoot("partial");

  await play(page, "adventure");
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await shoot("solved");
  await expect
    .poll(async () => (await wordWheelAttemptFor(email))?.completed)
    .toBe(true);
  expect((await wordWheelAttemptFor(email)).words).toEqual([
    "adventure",
    "vent",
    "venue",
  ]);
});
