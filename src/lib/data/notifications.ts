import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import type { UnsubscribeKind } from "@/lib/email/unsubscribe";
import { addDays, londonDate } from "@/utils/london-time";

export const STREAK_MILESTONES = [7, 30, 100, 365];

export type Recipient = { userId: string; email: string; name: string };
export type DigestRow = Recipient & {
  puzzles: { typeKey: string; typeName: string; slug: string; title: string }[];
  milestoneDays: number | null;
};
export type NudgeRow = Recipient & { streak: number };

const milestoneList = sql.join(
  STREAK_MILESTONES.map((days) => sql`${days}`),
  sql`, `,
);

/**
 * Opted-in, verified users not yet handled today (London), with the curated puzzles of their favourite types
 * published since their last digest run and not after `now`, and the streak milestone they reached yesterday.
 * Dailies are never listed. A user with nothing new and no milestone is still returned, so the run can record it.
 */
export async function selectFavouriteDigests(now: Date): Promise<DigestRow[]> {
  const today = londonDate(now);
  const yesterday = addDays(today, -1);
  const users = await db.execute<{
    user_id: string;
    email: string;
    name: string;
    milestone_days: number | null;
  }>(sql`
    select u.id as user_id, u.email, u.name, m.days as milestone_days
    from user_settings s
    join "user" u on u.id = s.user_id
    left join lateral (
      select k.current_streak - case when exists (
        select 1 from user_daily_solves d where d.user_id = s.user_id and d.day = ${today}::date
      ) then 1 else 0 end as days
      from user_streaks k
      where k.user_id = s.user_id
        and exists (select 1 from user_daily_solves d where d.user_id = s.user_id and d.day = ${yesterday}::date)
    ) m on m.days in (${milestoneList})
    where s.notify_favourites
      and u.email_verified
      and (s.favourites_digest_at at time zone 'Europe/London')::date < ${today}::date
  `);
  if (users.rows.length === 0) return [];
  const puzzles = await db.execute<{
    user_id: string;
    type_key: string;
    type_name: string;
    slug: string;
    title: string;
  }>(sql`
    select s.user_id, p.type_key, t.name as type_name, p.slug, p.title
    from user_settings s
    join user_favourite_types f on f.user_id = s.user_id
    join puzzles p on p.type_key = f.type_key
    join puzzle_types t on t.key = p.type_key
    where s.notify_favourites
      and (s.favourites_digest_at at time zone 'Europe/London')::date < ${today}::date
      and p.published_at > s.favourites_digest_at
      and p.published_at <= ${now.toISOString()}::timestamptz
      and not exists (select 1 from daily_puzzles d where d.puzzle_id = p.id)
      and not exists (select 1 from gear_daily g where g.puzzle_id = p.id)
    order by p.published_at, p.title
  `);
  return users.rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    name: row.name,
    milestoneDays: row.milestone_days,
    puzzles: puzzles.rows
      .filter((puzzle) => puzzle.user_id === row.user_id)
      .map((puzzle) => ({
        typeKey: puzzle.type_key,
        typeName: puzzle.type_name,
        slug: puzzle.slug,
        title: puzzle.title,
      })),
  }));
}

export async function markFavouritesDigestRun(userId: string, now: Date) {
  await db
    .update(userSettings)
    .set({ favouritesDigestAt: now })
    .where(eq(userSettings.userId, userId));
}

/** Opted-in, verified users with a current streak of 2 or more, no solve today (London) and no nudge today. */
export async function selectStreakNudges(now: Date): Promise<NudgeRow[]> {
  const today = londonDate(now);
  const result = await db.execute<{
    user_id: string;
    email: string;
    name: string;
    current_streak: number;
  }>(sql`
    select u.id as user_id, u.email, u.name, k.current_streak
    from user_settings s
    join "user" u on u.id = s.user_id
    join user_streaks k on k.user_id = s.user_id
    where s.notify_streak
      and u.email_verified
      and k.current_streak >= 2
      and not exists (select 1 from user_daily_solves d where d.user_id = s.user_id and d.day = ${today}::date)
      and (s.nudge_sent_at is null or (s.nudge_sent_at at time zone 'Europe/London')::date < ${today}::date)
  `);
  return result.rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    name: row.name,
    streak: row.current_streak,
  }));
}

export async function markStreakNudgeSent(userId: string, now: Date) {
  await db
    .update(userSettings)
    .set({ nudgeSentAt: now })
    .where(eq(userSettings.userId, userId));
}

const notificationColumns = {
  favourites: "notifyFavourites",
  streak: "notifyStreak",
} as const;

export async function clearNotification(userId: string, kind: UnsubscribeKind) {
  await db
    .update(userSettings)
    .set({ [notificationColumns[kind]]: false })
    .where(eq(userSettings.userId, userId));
}
