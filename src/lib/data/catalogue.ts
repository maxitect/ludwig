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

/** The daily shelf keeps a type page small: a year of dailies would add hundreds of thumbnails. */
const DAILY_SHELF_SIZE = 14;
const DAILY_STYLE = "Daily";

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
          daily: { columns: { date: true } },
        },
      },
    },
  });
  if (!type) return null;
  const { puzzles: rows, ...rest } = type;
  const puzzles = rows.map(({ crossword, daily, ...puzzle }) => ({
    ...puzzle,
    style: crossword?.style ?? (daily ? DAILY_STYLE : null),
  }));
  // A daily's title carries its ISO date, so the query's title order is date order.
  const dailies = puzzles
    .filter(({ style }) => style === DAILY_STYLE)
    .slice(-DAILY_SHELF_SIZE)
    .reverse();
  const volumes = new Map(
    puzzles.flatMap(({ volume }) => (volume ? [[volume.id, volume]] : [])),
  );
  return {
    type: rest,
    puzzleIds: puzzles.map(({ id }) => id),
    puzzles: [
      ...dailies,
      ...puzzles.filter(({ style }) => style !== DAILY_STYLE),
    ],
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

function newest<T extends { date: string }>(dailies: T[], count: number) {
  return dailies.toSorted((a, b) => b.date.localeCompare(a.date)).slice(0, count);
}

/** Prerenders curated puzzles, each type's shelf dailies and today's gear daily. Other published dailies render on first request, and an unpublished one is never prerendered as a 404. */
export async function getPuzzleStaticParams() {
  const rows = await db.query.puzzles.findMany({
    columns: { typeKey: true, slug: true },
    where: { RAW: isPublished },
    with: {
      daily: { columns: { date: true } },
      gearDaily: { columns: { date: true } },
    },
  });
  const curated = rows.filter(({ daily, gearDaily }) => !daily && !gearDaily);
  const dailies = rows.flatMap(({ typeKey, slug, daily }) =>
    daily ? [{ typeKey, slug, date: daily.date }] : [],
  );
  const gearDailies = rows.flatMap(({ typeKey, slug, gearDaily }) =>
    gearDaily ? [{ typeKey, slug, date: gearDaily.date }] : [],
  );
  const shelves = [
    ...Map.groupBy(dailies, ({ typeKey }) => typeKey).values(),
  ].flatMap((typeDailies) => newest(typeDailies, DAILY_SHELF_SIZE));
  return [...curated, ...shelves, ...newest(gearDailies, 1)].map(
    ({ typeKey, slug }) => ({ type: typeKey, slug }),
  );
}

export async function getTypeStaticParams() {
  const rows = await db.query.puzzleTypes.findMany({ columns: { key: true } });
  return rows.map(({ key }) => ({ type: key }));
}
