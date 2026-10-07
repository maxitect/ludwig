import { expect, test, type Page } from "@playwright/test";
import { content as caesarContent } from "../content/caesar/notebook-margin";
import { content as keywordContent } from "../content/keyword/inkwell";
import { lettersOf } from "../src/puzzles/_shared/cipher-key/cipher-key";
import { deriveCiphertext as caesarCipher } from "../src/puzzles/caesar/derive";
import { deriveCiphertext as keywordCipher } from "../src/puzzles/keyword/derive";
import { signUp, uniqueEmail } from "./helpers/auth";
import { cipherAttemptFor, databaseAvailable } from "./helpers/db";
import { openPuzzle } from "./helpers/solve";

const MAX_TABS = 80;

/** The distinct cipher letters in alphabetical order, each with the plain letter it stands for. */
function keyOf(plaintext: string, ciphertext: string) {
  const pairs = new Map<string, string>();
  const plain = lettersOf(plaintext);
  [...lettersOf(ciphertext)].forEach((letter, index) =>
    pairs.set(letter, plain[index]),
  );
  return [...pairs].sort(([a], [b]) => a.localeCompare(b));
}

/** Tabs from the top of the page until a cipher-key slot holds focus. */
async function tabIntoPanel(page: Page) {
  await expect(page.getByRole("group", { name: "Cipher key" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inPanel = await page.evaluate(() =>
      document.activeElement
        ?.getAttribute("aria-label")
        ?.startsWith("Cipher letter"),
    );
    if (inPanel) return;
  }
  throw new Error("The cipher key never received keyboard focus");
}

const cases = [
  {
    typeKey: "caesar" as const,
    slug: "notebook-margin",
    plaintext: caesarContent.plaintext,
    ciphertext: caesarCipher(caesarContent.plaintext, caesarContent.shift),
  },
  {
    typeKey: "keyword" as const,
    slug: "inkwell",
    plaintext: keywordContent.plaintext,
    ciphertext: keywordCipher(keywordContent.plaintext, keywordContent.keyword),
  },
];

for (const { typeKey, slug, plaintext, ciphertext } of cases) {
  test(`solve a ${typeKey} cipher with the keyboard only`, async ({ page }) => {
    const email = uniqueEmail(`cipher-${typeKey}`);
    await signUp(page, email);
    await openPuzzle(page, { typeKey, slug });
    await tabIntoPanel(page);

    await page.keyboard.type(
      keyOf(plaintext, ciphertext)
        .map(([, plain]) => plain)
        .join(""),
    );
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByText(/Solved in/)).toBeVisible();

    if (databaseAvailable) {
      await expect
        .poll(async () => (await cipherAttemptFor(email, typeKey))?.completed)
        .toBe(true);
      expect((await cipherAttemptFor(email, typeKey)).answer).toBe(
        lettersOf(plaintext),
      );
    }
  });
}

test("guesses survive a reload", async ({ page }) => {
  const email = uniqueEmail("cipher-save");
  const { plaintext, shift } = caesarContent;
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "caesar", slug: "notebook-margin" });
  await tabIntoPanel(page);
  const [[cipherLetter, plainLetter]] = keyOf(
    plaintext,
    caesarCipher(plaintext, shift),
  );
  const autosave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      "next-action" in response.request().headers(),
  );
  await page.keyboard.press(plainLetter);
  await autosave;
  await page.reload();
  await expect(
    page.getByRole("textbox", {
      name: `Cipher letter ${cipherLetter.toUpperCase()}, guess ${plainLetter.toUpperCase()}`,
    }),
  ).toBeVisible();
});
