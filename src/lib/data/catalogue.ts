import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { isPublished } from "./puzzles";

/** Volume order, then position, then slug, so the choice is stable. Puzzles outside a volume come last. */
function firstInVolumeOrder<
  T extends {
    slug: string;
    volumePosition: number | null;
    volume: { sort: number } | null;
  },
>(puzzles: T[]) {
  return puzzles.toSorted(
    (a, b) =>
      (a.volume?.sort ?? Infinity) - (b.volume?.sort ?? Infinity) ||
      (a.volumePosition ?? 0) - (b.volumePosition ?? 0) ||
      a.slug.localeCompare(b.slug),
  )[0];
}

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
        with: {
          puzzles: {
            columns: { id: true, slug: true, volumePosition: true },
            where: { RAW: isPublished },
            with: { volume: { columns: { sort: true } } },
          },
        },
      },
    },
  });
  return categories.map((category) => ({
    ...category,
    types: category.types.map(({ puzzles, ...type }) => ({
      ...type,
      published: puzzles.length,
      puzzleIds: puzzles.map(({ id }) => id),
      representativeId: firstInVolumeOrder(puzzles)?.id ?? null,
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
        columns: { id: true, slug: true, title: true, difficulty: true },
        where: { RAW: isPublished },
        orderBy: { title: "asc" },
        with: {
          volume: { columns: { id: true, title: true, sort: true } },
          crossword: { columns: { style: true } },
        },
      },
    },
  });
  if (!type) return null;
  const { puzzles: rows, ...rest } = type;
  const puzzles = rows.map(({ crossword, ...puzzle }) => ({
    ...puzzle,
    style: crossword?.style ?? null,
  }));
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

/** Includes the next published puzzle in the same volume, ordered by position. */
export async function getPuzzleSummary(typeKey: string, slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  const puzzle = await db.query.puzzles.findFirst({
    where: { typeKey, slug, RAW: isPublished },
    columns: { title: true, difficulty: true, volumePosition: true },
    with: {
      type: {
        columns: { name: true },
        with: { category: { columns: { name: true } } },
      },
      volume: {
        columns: { id: true },
        with: {
          puzzles: {
            columns: { typeKey: true, slug: true, volumePosition: true },
            where: { RAW: isPublished },
            orderBy: { volumePosition: "asc" },
          },
        },
      },
    },
  });
  if (!puzzle) return null;
  const position = puzzle.volumePosition ?? 0;
  return {
    title: puzzle.title,
    difficulty: puzzle.difficulty,
    typeName: puzzle.type.name,
    categoryName: puzzle.type.category.name,
    next:
      puzzle.volume?.puzzles.find(
        ({ volumePosition }) => (volumePosition ?? 0) > position,
      ) ?? null,
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
