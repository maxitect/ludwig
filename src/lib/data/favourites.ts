import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userFavouriteTypes, userTypeVisits } from "@/db/schema";
import { NEW_WINDOW_DAYS } from "@/config/new-puzzles";
import { getCurrentUser, requireUser } from "@/lib/data/user";

/** Null when signed out, so a caller can tell "no favourites" from "no user". */
export async function getFavouriteTypeKeys() {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db.query.userFavouriteTypes.findMany({
    where: { userId: user.id },
    columns: { typeKey: true },
  });
  return new Set(rows.map(({ typeKey }) => typeKey));
}

export async function setFavouriteType(typeKey: string) {
  const { id: userId } = await requireUser();
  const [removed] = await db
    .delete(userFavouriteTypes)
    .where(
      and(
        eq(userFavouriteTypes.userId, userId),
        eq(userFavouriteTypes.typeKey, typeKey),
      ),
    )
    .returning({ typeKey: userFavouriteTypes.typeKey });
  if (removed) return false;
  await db
    .insert(userFavouriteTypes)
    .values({ userId, typeKey })
    .onConflictDoNothing();
  return true;
}

export async function recordTypeVisit(typeKey: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .insert(userTypeVisits)
    .values({ userId: user.id, typeKey })
    .onConflictDoUpdate({
      target: [userTypeVisits.userId, userTypeVisits.typeKey],
      set: { visitedAt: sql`now()` },
    });
}

/**
 * The user's favourite types, each with its newest published puzzle and how many non-daily puzzles were
 * published since the user last opened the type page (the New window when they never have).
 */
export async function getFavouriteShelf(userId: string) {
  const favourites = await db.query.userFavouriteTypes.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    columns: {},
    with: {
      type: {
        columns: { key: true, name: true },
        with: {
          puzzles: {
            columns: { slug: true, title: true },
            where: { RAW: (t) => sql`${t.publishedAt} <= now()` },
            orderBy: { publishedAt: "desc", title: "desc" },
            limit: 1,
          },
        },
      },
    },
  });
  if (favourites.length === 0) return [];
  const counts = await db.execute<{ type_key: string; fresh: number }>(sql`
    select p.type_key, count(*)::integer as fresh
    from puzzles p
    join user_favourite_types f on f.type_key = p.type_key and f.user_id = ${userId}
    left join user_type_visits v on v.type_key = p.type_key and v.user_id = ${userId}
    where p.published_at <= now()
      and p.published_at > coalesce(v.visited_at, now() - make_interval(days => ${NEW_WINDOW_DAYS}))
      and not exists (select 1 from daily_puzzles d where d.puzzle_id = p.id)
      and not exists (select 1 from gear_daily g where g.puzzle_id = p.id)
    group by p.type_key
  `);
  const fresh = new Map(counts.rows.map((row) => [row.type_key, row.fresh]));
  return favourites.map(({ type }) => ({
    key: type.key,
    name: type.name,
    newest: type.puzzles[0] ?? null,
    fresh: fresh.get(type.key) ?? 0,
  }));
}
