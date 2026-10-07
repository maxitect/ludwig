import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import {
  attempts,
  bookCipherPuzzles,
  bookCipherRefs,
  bookTextLines,
  bookTexts,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { bookCipherModule } from "./module";
import { payloadSchema } from "./schema";

const textSlug = "t053-test-text";
const otherSlug = "t053-other-text";

const lines = [
  { page: 1, line: 1, content: "the lantern burns low" },
  { page: 1, line: 2, content: "until dawn comes round" },
  { page: 2, line: 1, content: "again" },
];

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('bc-test', 'bc', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('book-cipher', 'bc-test', 'bc', 'bc', 'book_cipher_puzzles', 1)
    on conflict (key) do nothing
  `);
}

async function insertText(tx: Tx, slug: string) {
  const [text] = await tx
    .insert(bookTexts)
    .values({
      slug,
      title: "A Test Book",
      author: "An Author",
      source: "https://example.test",
      publicDomainBasis: "test",
    })
    .returning({ id: bookTexts.id });
  await tx
    .insert(bookTextLines)
    .values(lines.map((line) => ({ ...line, textId: text.id })));
  return text.id;
}

async function insertPuzzle(tx: Tx, textId: string, slug = "one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey: "book-cipher", slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  await tx.insert(bookCipherPuzzles).values({ puzzleId: row.id, textId });
  return row.id;
}

describe("book cipher integrity", () => {
  it("stores no plaintext, json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where (table_name like 'book_cipher%' or table_name like 'book_text%')
        and (data_type in ('jsonb', 'json', 'ARRAY')
             or column_name in ('plaintext', 'word', 'words', 'message'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("fills text_id from the puzzle when a ref omits it", async () => {
    let filled: string | undefined;
    let expected: string | undefined;
    await pgError(async (tx) => {
      const textId = await insertText(tx, textSlug);
      const puzzleId = await insertPuzzle(tx, textId);
      await tx
        .insert(bookCipherRefs)
        .values({ puzzleId, position: 0, page: 1, line: 1, wordIndex: 2 });
      const [ref] = await tx
        .select({ textId: bookCipherRefs.textId })
        .from(bookCipherRefs)
        .where(eq(bookCipherRefs.puzzleId, puzzleId));
      filled = ref.textId;
      expected = textId;
    });
    expect(filled).toBeDefined();
    expect(filled).toBe(expected);
  });

  it("rejects a ref whose explicit text_id differs from the puzzle's", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const textId = await insertText(tx, textSlug);
        const otherId = await insertText(tx, otherSlug);
        const puzzleId = await insertPuzzle(tx, textId);
        await tx.insert(bookCipherRefs).values({
          puzzleId,
          position: 0,
          textId: otherId,
          page: 1,
          line: 1,
          wordIndex: 1,
        });
      }),
    ).toBe("23503");
  });

  it("accepts a ref whose explicit text_id matches", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const textId = await insertText(tx, textSlug);
        const puzzleId = await insertPuzzle(tx, textId);
        await tx.insert(bookCipherRefs).values({
          puzzleId,
          position: 0,
          textId,
          page: 2,
          line: 1,
          wordIndex: 1,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    { page: 3, line: 1 },
    { page: 1, line: 9 },
    { page: 2, line: 2 },
  ])("rejects a ref to the missing page $page, line $line", async (where) => {
    expect(
      await pgErrorCode(async (tx) => {
        const textId = await insertText(tx, textSlug);
        const puzzleId = await insertPuzzle(tx, textId);
        await tx
          .insert(bookCipherRefs)
          .values({ puzzleId, position: 0, ...where, wordIndex: 1 });
      }),
    ).toBe("23503");
  });

  it("rejects removing a line a puzzle references", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const textId = await insertText(tx, textSlug);
        const puzzleId = await insertPuzzle(tx, textId);
        await tx
          .insert(bookCipherRefs)
          .values({ puzzleId, position: 0, page: 2, line: 1, wordIndex: 1 });
        await tx.delete(bookTextLines).where(eq(bookTextLines.page, 2));
      }),
    ).toBe("23503");
  });

  it("rejects a zero word index", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const textId = await insertText(tx, textSlug);
        const puzzleId = await insertPuzzle(tx, textId);
        await tx.insert(bookCipherRefs).values({
          puzzleId,
          position: 0,
          page: 1,
          line: 1,
          wordIndex: 0,
        });
      }),
    ).toBe("23514");
  });
});

describe("book cipher module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const content = {
    textSlug,
    refs: [
      { page: 1, line: 2, wordIndex: 2 },
      { page: 2, line: 1, wordIndex: 1 },
      { page: 1, line: 1, wordIndex: 2 },
    ],
  };

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "bc-test", name: "bc", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "book-cipher",
        categoryKey: "bc-test",
        name: "bc",
        description: "bc",
        subtypeTable: "book_cipher_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    await db.transaction(async (tx) => {
      await insertText(tx, textSlug);
    });
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "book-cipher",
          slug: "t053-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await bookCipherModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t053bcmod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    await db.delete(bookTexts).where(eq(bookTexts.slug, textSlug));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the references and the whole text, but not the message", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(payload.refs).toEqual([
      { position: 0, page: 1, line: 2, wordIndex: 2 },
      { position: 1, page: 2, line: 1, wordIndex: 1 },
      { position: 2, page: 1, line: 1, wordIndex: 2 },
    ]);
    expect(payload.lines).toEqual(lines);
    expect(Object.keys(payload).sort()).toEqual([
      "author",
      "lines",
      "refs",
      "title",
    ]);
    expect(JSON.stringify(payload)).not.toContain("dawn again lantern");
  });

  it("derives the plaintext from the references", async () => {
    expect(await loadSolution(puzzleId)).toEqual({
      plaintext: "dawn again lantern",
    });
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(check(payload, solution, { answer: "Dawn again lantern" }).correct).toBe(true);
    expect(check(payload, solution, { answer: "dawn again lantern x" }).correct).toBe(false);
  });

  it("updates in place, dropping references the content no longer has", async () => {
    await db.transaction((tx) =>
      bookCipherModule.upsertContent(tx, puzzleId, {
        textSlug,
        refs: content.refs.slice(0, 2).reverse(),
      }),
    );
    expect((await loadSolution(puzzleId)).plaintext).toBe("again dawn");
    await db.transaction((tx) =>
      bookCipherModule.upsertContent(tx, puzzleId, content),
    );
    expect((await loadSolution(puzzleId)).plaintext).toBe(
      "dawn again lantern",
    );
  });

  it("moves a puzzle and its references to another text", async () => {
    await db.transaction(async (tx) => {
      await insertText(tx, otherSlug);
    });
    try {
      await db.transaction((tx) =>
        bookCipherModule.upsertContent(tx, puzzleId, {
          ...content,
          textSlug: otherSlug,
        }),
      );
      const other = await db.query.bookTexts.findFirst({
        where: { slug: otherSlug },
        columns: { id: true },
      });
      const refTexts = await db
        .selectDistinct({ textId: bookCipherRefs.textId })
        .from(bookCipherRefs)
        .where(eq(bookCipherRefs.puzzleId, puzzleId));
      expect(refTexts).toEqual([{ textId: other!.id }]);
      expect((await loadSolution(puzzleId)).plaintext).toBe(
        "dawn again lantern",
      );
    } finally {
      await db.transaction((tx) =>
        bookCipherModule.upsertContent(tx, puzzleId, content),
      );
      await db.delete(bookTexts).where(eq(bookTexts.slug, otherSlug));
    }
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await bookCipherModule.loadAttemptState(attempt.id)).toBeNull();
    await db.transaction((tx) =>
      bookCipherModule.replaceAttemptState(tx, attempt.id, {
        answer: "dawn _ _",
      }),
    );
    await db.transaction((tx) =>
      bookCipherModule.replaceAttemptState(tx, attempt.id, {
        answer: "dawn again _",
      }),
    );
    expect(await bookCipherModule.loadAttemptState(attempt.id)).toEqual({
      answer: "dawn again _",
    });
    await bookCipherModule.clearAttemptState(attempt.id);
    expect(await bookCipherModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
