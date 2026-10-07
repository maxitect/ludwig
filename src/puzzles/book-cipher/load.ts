import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

/**
 * The references and the whole source text, so the reader can open any page. The words the
 * references point at are never derived here.
 */
export async function load(puzzleId: string) {
  const puzzle = await db.query.bookCipherPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      text: {
        columns: { title: true, author: true },
        with: {
          lines: {
            columns: { page: true, line: true, content: true },
            orderBy: { page: "asc", line: "asc" },
          },
        },
      },
      refs: {
        columns: { position: true, page: true, line: true, wordIndex: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Book cipher puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    title: puzzle.text.title,
    author: puzzle.text.author,
    lines: puzzle.text.lines,
    refs: puzzle.refs,
  });
}
