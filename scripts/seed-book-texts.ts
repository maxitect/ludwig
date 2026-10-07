import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { db as appDb } from "../src/db";
import { bookTextLines, bookTexts } from "../src/db/schema";
import { bookTextFileSchema } from "../src/puzzles/book-cipher/book-text";
import { paginate } from "../src/puzzles/book-cipher/derive";

type Db = typeof appDb;

/**
 * Upserts each source text by slug and rewrites its paginated lines. Lines the pagination no longer
 * has are deleted, which fails (and rolls that text back) while a puzzle still references them.
 */
export async function seedBookTexts(db: Db, files: unknown) {
  const parsed = z.array(bookTextFileSchema).safeParse(files);
  if (!parsed.success) {
    return {
      texts: 0,
      failures: parsed.error.issues.map(
        (issue) => `book-texts[${issue.path.join(".")}]: ${issue.message}`,
      ),
    };
  }
  const failures: string[] = [];
  for (const { meta, paragraphs } of parsed.data) {
    try {
      await db.transaction(async (tx) => {
        const [{ id }] = await tx
          .insert(bookTexts)
          .values(meta)
          .onConflictDoUpdate({
            target: bookTexts.slug,
            set: {
              title: sql`excluded.title`,
              author: sql`excluded.author`,
              source: sql`excluded.source`,
              publicDomainBasis: sql`excluded.public_domain_basis`,
            },
          })
          .returning({ id: bookTexts.id });
        const lines = paginate(paragraphs);
        await tx.delete(bookTextLines).where(
          and(
            eq(bookTextLines.textId, id),
            sql`(${bookTextLines.page}, ${bookTextLines.line}) not in (${sql.join(
              lines.map(({ page, line }) => sql`(${page}, ${line})`),
              sql`, `,
            )})`,
          ),
        );
        await tx
          .insert(bookTextLines)
          .values(lines.map((line) => ({ ...line, textId: id })))
          .onConflictDoUpdate({
            target: [
              bookTextLines.textId,
              bookTextLines.page,
              bookTextLines.line,
            ],
            set: { content: sql`excluded.content` },
          });
      });
    } catch (error) {
      const cause = (error as { cause?: Error }).cause ?? error;
      failures.push(
        `book-texts/${meta.slug}: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }
  }
  return { texts: parsed.data.length - failures.length, failures };
}
