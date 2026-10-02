import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { content } from "../../../content/reverse-chess/dev-rook-check";
import {
  createTestUser,
  deleteTestUsers,
  rolledBack,
} from "@/db/integrity/harness";
import { attempts, puzzles } from "@/db/schema";
import { reverseChessModule } from "./module";
import { reverseChessAttemptPlies, reverseChessPuzzles } from "./tables";

afterAll(deleteTestUsers);

const ply = (fromFile: "a" | "h") =>
  ({
    fromFile,
    fromRank: 1,
    toFile: "e",
    toRank: 2,
    unpromote: false,
    special: "none",
  }) as const;

describe("reverse-chess replaceAttemptState", () => {
  it("replaces the attempt plies instead of appending", async () => {
    const userId = await createTestUser("t017rc");
    const { pieces: _pieces, solutionPlies: _plies, ...columns } = content;
    const stored = await rolledBack(async (tx) => {
      await tx.execute(
        sql`insert into puzzle_categories (key, name, sort) values ('rc-test', 'rc', 99) on conflict (key) do nothing`,
      );
      await tx.execute(sql`
        insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
        values ('reverse-chess', 'rc-test', 'rc', 'rc', 'reverse_chess_puzzles', 1)
        on conflict (key) do nothing`);
      const [puzzle] = await tx
        .insert(puzzles)
        .values({
          typeKey: "reverse-chess",
          slug: "t017",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await tx
        .insert(reverseChessPuzzles)
        .values({ ...columns, puzzleId: puzzle.id, plyCount: 1 });
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId: puzzle.id })
        .returning({ id: attempts.id });

      await reverseChessModule.replaceAttemptState(tx, attempt.id, {
        plies: [ply("a"), ply("h"), ply("a")],
      });
      await reverseChessModule.replaceAttemptState(tx, attempt.id, {
        plies: [ply("h")],
      });
      return tx
        .select({
          ply: reverseChessAttemptPlies.ply,
          fromFile: reverseChessAttemptPlies.fromFile,
        })
        .from(reverseChessAttemptPlies)
        .where(eq(reverseChessAttemptPlies.attemptId, attempt.id));
    });
    expect(stored).toEqual([{ ply: 1, fromFile: "h" }]);
  });
});
