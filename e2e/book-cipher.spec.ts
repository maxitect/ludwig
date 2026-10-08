import { expect, test } from "@playwright/test";
import { bookTexts } from "../content/book-texts";
import { content } from "../content/book-cipher/hand-lens";
import { derivePlaintext, paginate } from "../src/puzzles/book-cipher/derive";
import { signUp, uniqueEmail } from "./helpers/auth";
import { cipherAttemptFor, databaseAvailable } from "./helpers/db";
import { openPuzzle, clickCheck } from "./helpers/solve";

const plaintext = derivePlaintext(paginate(bookTexts[0].paragraphs), content.refs);
const { page: firstPage, line, wordIndex } = content.refs[0];

test("solve a book cipher, turning pages by keyboard", async ({ page }) => {
  const email = uniqueEmail("book-cipher");
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "book-cipher", slug: "hand-lens" });

  const reader = page.getByRole("region", { name: /Natural History of Selborne/ });
  await expect(reader).toContainText(`Page ${firstPage} of`);

  await reader.focus();
  await page.keyboard.press("ArrowRight");
  await expect(reader).toContainText(`Page ${firstPage + 1} of`);
  await page.keyboard.press("ArrowLeft");
  await expect(reader).toContainText(`Page ${firstPage} of`);

  const inputs = page.getByRole("textbox", { name: /^Word \d+:/ });
  await expect(inputs).toHaveCount(content.refs.length);
  await inputs.first().focus();
  await expect(reader.locator("mark")).toContainText(
    `Page ${firstPage}, line ${line}, word ${wordIndex}`,
  );

  const words = plaintext.split(" ");
  for (const [i, word] of words.entries()) {
    await inputs.nth(i).fill(word);
  }
  await clickCheck(page);
  await expect(page.getByText(/Solved in/)).toBeVisible();

  if (databaseAvailable) {
    await expect
      .poll(async () => (await cipherAttemptFor(email, "book-cipher"))?.completed)
      .toBe(true);
    expect((await cipherAttemptFor(email, "book-cipher")).answer).toBe(plaintext);
  }
});
