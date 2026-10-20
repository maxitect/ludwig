import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, chessProblemPlies, databaseAvailable } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T085";
const SLUG = "a-quiet-word";

const board = (page: Page) =>
  page.getByRole("application", { name: "Chess board" });
const message = (page: Page) => page.getByTestId("problem-message");

/** The board cursor starts on e4. Walks it to `to` with the arrow keys and presses Enter. */
async function press(page: Page, from: string, to: string) {
  const dx = to.charCodeAt(0) - from.charCodeAt(0);
  const dy = Number(to[1]) - Number(from[1]);
  for (let i = 0; i < Math.abs(dx); i++) {
    await page.keyboard.press(dx > 0 ? "ArrowRight" : "ArrowLeft");
  }
  for (let i = 0; i < Math.abs(dy); i++) {
    await page.keyboard.press(dy > 0 ? "ArrowUp" : "ArrowDown");
  }
  await page.keyboard.press("Enter");
}

/** Picks up the piece on `from` and drops it on `to`, starting with the cursor on `cursor`. Returns the new cursor square. */
async function move(page: Page, cursor: string, from: string, to: string) {
  await press(page, cursor, from);
  await press(page, from, to);
  return to;
}

test("solve by keyboard, hear Black's reply, and keep the line in the database", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t085-key");
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "chess-problem", slug: SLUG });
  await expect(board(page)).toBeVisible();
  await board(page).focus();

  let cursor = await move(page, "e4", "c2", "c6");
  await expect(message(page)).toHaveText(/Black replies Ka7\. Your move C\./);
  await expect(page.getByTestId("line-ply")).toHaveCount(2);

  cursor = await move(page, cursor, "c6", "b7");
  await expect(page.getByTestId("line-ply")).toHaveCount(3);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  const labels = await page.getByTestId("line-ply").allInnerTexts();
  expect(labels.map((text) => text.split("\n")[0])).toEqual(["A", "B", "C"]);
  expect(cursor).toBe("b7");

  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect(await chessProblemPlies(email)).toEqual([
    { ply: 1, from: "c2", to: "c6" },
    { ply: 2, from: "b8", to: "a7" },
    { ply: 3, from: "c6", to: "b7" },
  ]);
});

test("a first move that does not force mate is refused, and undo takes it back", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t085-wrong");
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "chess-problem", slug: SLUG });
  await board(page).focus();

  const cursor = await move(page, "e4", "c2", "c7");
  await expect(message(page)).toHaveText(/Black replies Kxc7/);
  await move(page, cursor, "c1", "d1");
  await expect(message(page)).toHaveText("That doesn't force mate.");
  await expect(page.getByText(/Solved in/)).toHaveCount(0);
  expect((await attemptsFor(email))[0]?.completed).toBe(false);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("line-ply")).toHaveCount(2);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("line-ply")).toHaveCount(0);
});

test("the notation setting applies to the line, and both themes render the board", async ({
  page,
}, testInfo) => {
  await openPuzzle(page, { typeKey: "chess-problem", slug: "the-corner-office" });
  await board(page).focus();
  await move(page, "e4", "a1", "g7");
  await expect(page.getByTestId("line-ply").first()).toContainText("Qg7");
  await expect(page.getByTestId("line-ply")).toHaveCount(2);
  await page.getByRole("radio", { name: "Descriptive" }).click();
  await expect(page.getByTestId("line-ply").first()).toContainText("Q-KN7");

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.screenshot({
      path: `${SHOTS}/ac8-${theme}-${width}.png`,
      fullPage: true,
    });
  }
});
