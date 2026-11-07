import { expect, test, type Page } from "@playwright/test";
import {
  databaseAvailable,
  publishedPuzzles,
  type PublishedPuzzleRow,
} from "./helpers/db";

test.skip(!databaseAvailable, "needs the local database");

/** Troix is left out: `favourites.spec.ts` moves a troix puzzle's date while it runs. */
const MOVED_BY_OTHER_SPECS = new Set(["troix"]);

async function expectNewMarkers(page: Page, rows: PublishedPuzzleRow[]) {
  for (const { typeKey, slug, isNew } of rows) {
    const row = page
      .getByRole("listitem")
      .filter({ has: page.locator(`a[href="/puzzles/${typeKey}/${slug}"]`) });
    await expect(row.getByText("New", { exact: true })).toHaveCount(
      isNew ? 1 : 0,
    );
  }
}

test("New marks puzzles published in the last 14 days, never a daily", async ({
  page,
}) => {
  const rows = await publishedPuzzles();
  const byType = Map.groupBy(rows, ({ typeKey }) => typeKey);
  const mixed = [...byType.values()].find(
    (typeRows) =>
      !MOVED_BY_OTHER_SPECS.has(typeRows[0].typeKey) &&
      typeRows.some(({ isNew }) => isNew) &&
      typeRows.some(({ isNew, daily }) => !isNew && !daily),
  );
  test.skip(!mixed, "no type has both new and older puzzles in this database");
  const [{ typeKey }] = mixed!;
  const newCount = mixed!.filter(({ isNew }) => isNew).length;

  await page.goto(`/puzzles/${typeKey}`);
  await expectNewMarkers(page, mixed!);

  await page.goto("/puzzles");
  const card = page
    .getByRole("listitem")
    .filter({ has: page.locator(`a[href="/puzzles/${typeKey}"]`) });
  await expect(card.getByText(`${newCount} new`, { exact: true })).toBeVisible();

  const dailies = rows.filter(
    ({ daily, typeKey: key }) => daily && !MOVED_BY_OTHER_SPECS.has(key),
  );
  for (const [key, typeRows] of Map.groupBy(dailies, (row) => row.typeKey)) {
    await page.goto(`/puzzles/${key}`);
    await expectNewMarkers(page, typeRows);
  }
});
