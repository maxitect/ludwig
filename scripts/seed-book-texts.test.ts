import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  bookCipherPuzzles,
  bookCipherRefs,
  bookTextLines,
  bookTexts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { seedBookTexts } from "./seed-book-texts";

const slug = "t053-seed-text";
const meta = {
  slug,
  title: "A Seeded Book",
  author: "An Author",
  source: "https://example.test",
  publicDomainBasis: "test",
};
const longParagraph = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
const file = (paragraphs: string[], title = meta.title) => ({
  meta: { ...meta, title },
  paragraphs,
});

const textRow = () =>
  db.query.bookTexts.findFirst({
    where: { slug },
    columns: { id: true, title: true },
  });
const lineRows = (textId: string) =>
  db
    .select({ page: bookTextLines.page, line: bookTextLines.line })
    .from(bookTextLines)
    .where(eq(bookTextLines.textId, textId))
    .orderBy(asc(bookTextLines.page), asc(bookTextLines.line));

const insertedTypes: string[] = [];

async function cleanUp() {
  await db.delete(puzzles).where(eq(puzzles.slug, "t053-seed-puzzle"));
  await db.delete(bookTexts).where(eq(bookTexts.slug, slug));
}

beforeAll(async () => {
  await cleanUp();
  await db
    .insert(puzzleCategories)
    .values({ key: "bc-seed-test", name: "bc", sort: 99 })
    .onConflictDoNothing();
  const added = await db
    .insert(puzzleTypes)
    .values({
      key: "book-cipher",
      categoryKey: "bc-seed-test",
      name: "bc",
      description: "bc",
      subtypeTable: "book_cipher_puzzles",
      sort: 1,
    })
    .onConflictDoNothing()
    .returning({ key: puzzleTypes.key });
  insertedTypes.push(...added.map((row) => row.key));
});

afterAll(async () => {
  await cleanUp();
  for (const key of insertedTypes) {
    await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
  }
  await db.delete(puzzleCategories).where(eq(puzzleCategories.key, "bc-seed-test"));
});

describe("seedBookTexts", () => {
  it("upserts by slug, keeping the text id and dropping lines the text no longer has", async () => {
    expect(await seedBookTexts(db, [file([longParagraph, longParagraph])])).toEqual({
      texts: 1,
      failures: [],
    });
    const first = await textRow();
    expect((await lineRows(first!.id)).length).toBeGreaterThan(1);

    expect(await seedBookTexts(db, [file([longParagraph], "Renamed")])).toEqual({
      texts: 1,
      failures: [],
    });
    const second = await textRow();
    expect(second).toEqual({ id: first!.id, title: "Renamed" });
    expect(await lineRows(first!.id)).toEqual(
      [...Array(4)].map((_, i) => ({ page: 1, line: i + 1 })),
    );
  });

  it("fails naming the FK, and changes nothing, when a removed line is referenced", async () => {
    const text = await textRow();
    await db.transaction(async (tx) => {
      const [puzzle] = await tx
        .insert(puzzles)
        .values({ typeKey: "book-cipher", slug: "t053-seed-puzzle", title: "t", difficulty: 1 })
        .returning({ id: puzzles.id });
      await tx.insert(bookCipherPuzzles).values({ puzzleId: puzzle.id, textId: text!.id });
      await tx
        .insert(bookCipherRefs)
        .values({ puzzleId: puzzle.id, position: 0, page: 1, line: 4, wordIndex: 1 });
    });

    const summary = await seedBookTexts(db, [file(["one short line"], "Shrunk")]);
    expect(summary.texts).toBe(0);
    expect(summary.failures).toEqual([
      expect.stringMatching(
        new RegExp(`^book-texts/${slug}: .*book_cipher_refs_text_id_page_line_fk`),
      ),
    ]);
    expect(await textRow()).toEqual({ id: text!.id, title: "Renamed" });
    expect(await lineRows(text!.id)).toHaveLength(4);
  });

  it("rejects a blank paragraph, naming its path", async () => {
    expect(await seedBookTexts(db, [file(["   "])])).toEqual({
      texts: 0,
      failures: [expect.stringMatching(/^book-texts\[0\.paragraphs\.0\]: /)],
    });
  });
});
