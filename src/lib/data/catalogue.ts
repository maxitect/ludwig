import "server-only";
import { and, asc, count, eq, gt } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db } from "@/db";
import { puzzleCategories, puzzleTypes, puzzles } from "@/db/schema";
import { published } from "./puzzles";

export async function getCatalogue() {
  "use cache";
  cacheTag("puzzles");
  const [categories, counts] = await Promise.all([
    db.query.puzzleCategories.findMany({
      columns: { key: true, name: true },
      orderBy: { sort: "asc" },
      with: {
        types: {
          columns: { key: true, name: true, description: true },
          orderBy: { sort: "asc" },
        },
      },
    }),
    db
      .select({ typeKey: puzzles.typeKey, total: count() })
      .from(puzzles)
      .where(published)
      .groupBy(puzzles.typeKey),
  ]);
  const totals = new Map(counts.map(({ typeKey, total }) => [typeKey, total]));
  return categories.map((category) => ({
    ...category,
    types: category.types.map((type) => ({
      ...type,
      published: totals.get(type.key) ?? 0,
    })),
  }));
}

export async function getTypeCatalogue(typeKey: string) {
  "use cache";
  cacheTag("puzzles");
  const type = await db.query.puzzleTypes.findFirst({
    where: { key: typeKey },
    columns: { key: true, name: true, description: true },
    with: { category: { columns: { name: true } } },
  });
  if (!type) return null;
  const [typePuzzles, allVolumes] = await Promise.all([
    db
      .select({
        slug: puzzles.slug,
        title: puzzles.title,
        difficulty: puzzles.difficulty,
        volumeId: puzzles.volumeId,
      })
      .from(puzzles)
      .where(and(eq(puzzles.typeKey, typeKey), published))
      .orderBy(asc(puzzles.title)),
    db.query.volumes.findMany({
      columns: { id: true, title: true },
      orderBy: { sort: "asc" },
    }),
  ]);
  return {
    type,
    puzzles: typePuzzles,
    volumes: allVolumes
      .map(({ id, title }) => ({
        id,
        title,
        puzzleCount: typePuzzles.filter((puzzle) => puzzle.volumeId === id)
          .length,
      }))
      .filter(({ puzzleCount }) => puzzleCount > 0),
  };
}

/** Includes the next published puzzle in the same volume, ordered by slug. */
export async function getPuzzleSummary(typeKey: string, slug: string) {
  "use cache";
  cacheTag("puzzles");
  const [puzzle] = await db
    .select({
      title: puzzles.title,
      difficulty: puzzles.difficulty,
      volumeId: puzzles.volumeId,
      typeName: puzzleTypes.name,
      categoryName: puzzleCategories.name,
    })
    .from(puzzles)
    .innerJoin(puzzleTypes, eq(puzzleTypes.key, puzzles.typeKey))
    .innerJoin(
      puzzleCategories,
      eq(puzzleCategories.key, puzzleTypes.categoryKey),
    )
    .where(
      and(eq(puzzles.typeKey, typeKey), eq(puzzles.slug, slug), published),
    );
  if (!puzzle) return null;
  const { volumeId, ...summary } = puzzle;
  if (!volumeId) return { ...summary, next: null };
  const [next] = await db
    .select({ typeKey: puzzles.typeKey, slug: puzzles.slug })
    .from(puzzles)
    .where(
      and(eq(puzzles.volumeId, volumeId), gt(puzzles.slug, slug), published),
    )
    .orderBy(asc(puzzles.slug))
    .limit(1);
  return { ...summary, next: next ?? null };
}

/** Unpublished puzzles are included: Cache Components needs at least one param, and the page itself 404s on them. */
export async function getPuzzleStaticParams() {
  return db
    .select({ type: puzzles.typeKey, slug: puzzles.slug })
    .from(puzzles);
}

export async function getTypeStaticParams() {
  return db.select({ type: puzzleTypes.key }).from(puzzleTypes);
}
