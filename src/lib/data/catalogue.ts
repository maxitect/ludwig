import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { isPublished } from "./puzzles";

export async function getCatalogue() {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const categories = await db.query.puzzleCategories.findMany({
    columns: { key: true, name: true },
    orderBy: { sort: "asc" },
    with: {
      types: {
        columns: { key: true, name: true, description: true },
        orderBy: { sort: "asc" },
        with: { puzzles: { columns: { id: true }, where: { RAW: isPublished } } },
      },
    },
  });
  return categories.map((category) => ({
    ...category,
    types: category.types.map(({ puzzles, ...type }) => ({
      ...type,
      published: puzzles.length,
    })),
  }));
}

export async function getTypeCatalogue(typeKey: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const type = await db.query.puzzleTypes.findFirst({
    where: { key: typeKey },
    columns: { key: true, name: true, description: true },
    with: {
      category: { columns: { name: true } },
      puzzles: {
        columns: { slug: true, title: true, difficulty: true },
        where: { RAW: isPublished },
        orderBy: { title: "asc" },
        with: { volume: { columns: { id: true, title: true, sort: true } } },
      },
    },
  });
  if (!type) return null;
  const { puzzles, ...rest } = type;
  const volumes = new Map(
    puzzles.flatMap(({ volume }) => (volume ? [[volume.id, volume]] : [])),
  );
  return {
    type: rest,
    puzzles,
    volumes: [...volumes.values()]
      .sort((a, b) => a.sort - b.sort)
      .map(({ id, title }) => ({
        id,
        title,
        puzzleCount: puzzles.filter(({ volume }) => volume?.id === id).length,
      })),
  };
}

/** Includes the next published puzzle in the same volume, ordered by slug. */
export async function getPuzzleSummary(typeKey: string, slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const puzzle = await db.query.puzzles.findFirst({
    where: { typeKey, slug, RAW: isPublished },
    columns: { title: true, difficulty: true },
    with: {
      type: {
        columns: { name: true },
        with: { category: { columns: { name: true } } },
      },
      volume: {
        columns: { id: true },
        with: {
          puzzles: {
            columns: { typeKey: true, slug: true },
            where: { slug: { gt: slug }, RAW: isPublished },
            orderBy: { slug: "asc" },
            limit: 1,
          },
        },
      },
    },
  });
  if (!puzzle) return null;
  return {
    title: puzzle.title,
    difficulty: puzzle.difficulty,
    typeName: puzzle.type.name,
    categoryName: puzzle.type.category.name,
    next: puzzle.volume?.puzzles[0] ?? null,
  };
}

/** Unpublished puzzles are included: Cache Components needs at least one param, and the page itself 404s on them. */
export async function getPuzzleStaticParams() {
  const rows = await db.query.puzzles.findMany({
    columns: { typeKey: true, slug: true },
  });
  return rows.map(({ typeKey, slug }) => ({ type: typeKey, slug }));
}

export async function getTypeStaticParams() {
  const rows = await db.query.puzzleTypes.findMany({ columns: { key: true } });
  return rows.map(({ key }) => ({ type: key }));
}
