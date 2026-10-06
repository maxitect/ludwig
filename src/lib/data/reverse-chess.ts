import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { isPublished } from "./puzzles";

export async function getReverseChessHub() {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const rows = await db.query.puzzles.findMany({
    where: { typeKey: "reverse-chess", RAW: isPublished },
    columns: { id: true, slug: true, title: true, difficulty: true },
    orderBy: { difficulty: "asc", title: "asc" },
    with: {
      reverseChess: {
        columns: { mode: true },
        with: { goal: { columns: { kind: true } } },
      },
    },
  });
  const puzzles = rows.map(({ reverseChess, ...puzzle }) => {
    if (!reverseChess) {
      throw new Error(`Reverse chess puzzle ${puzzle.slug} has no subtype row`);
    }
    return {
      ...puzzle,
      mode: reverseChess.mode,
      proofGame: reverseChess.goal?.kind === "initial_position",
    };
  });
  return {
    lastMove: puzzles.filter(({ mode }) => mode === "last_move"),
    unwind: puzzles.filter(
      ({ mode, proofGame }) => mode === "unwind" && !proofGame,
    ),
    proofGame: puzzles.filter(({ proofGame }) => proofGame),
  };
}
