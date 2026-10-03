import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  pgView,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { puzzles } from "./core";

export const hintKindEnum = pgEnum("hint_kind", [
  "check_cell",
  "reveal_cell",
  "check_all",
  "reveal_all",
]);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    puzzleId: uuid("puzzle_id").notNull(),
    typeKey: text("type_key")
      .notNull()
      .default(sql`NULL`),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
  },
  (table) => [
    unique("attempts_user_id_puzzle_id_unique").on(
      table.userId,
      table.puzzleId,
    ),
    unique("attempts_id_type_key_unique").on(table.id, table.typeKey),
    unique("attempts_id_puzzle_id_type_key_unique").on(
      table.id,
      table.puzzleId,
      table.typeKey,
    ),
    foreignKey({
      name: "attempts_puzzle_id_type_key_fk",
      columns: [table.puzzleId, table.typeKey],
      foreignColumns: [puzzles.id, puzzles.typeKey],
    }).onDelete("cascade"),
  ],
);

export const attemptHints = pgTable(
  "attempt_hints",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    kind: hintKindEnum("kind").notNull(),
    row: smallint("row"),
    col: smallint("col"),
    usedAt: timestamp("used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("attempt_hints_row_check", sql`${table.row} >= 0`),
    check("attempt_hints_col_check", sql`${table.col} >= 0`),
    index("attempt_hints_attempt_id_idx").on(table.attemptId),
  ],
);

export const userSolves = pgView("user_solves", {
  attemptId: uuid("attempt_id").notNull(),
  userId: uuid("user_id").notNull(),
  puzzleId: uuid("puzzle_id").notNull(),
  typeKey: text("type_key").notNull(),
  typeName: text("type_name").notNull(),
  categoryKey: text("category_key").notNull(),
  puzzleSlug: text("puzzle_slug").notNull(),
  puzzleTitle: text("puzzle_title").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  durationMs: integer("duration_ms").notNull(),
  hints: integer("hints").notNull(),
}).as(sql`
  select
    a.id as attempt_id,
    a.user_id,
    a.puzzle_id,
    a.type_key,
    t.name as type_name,
    t.category_key,
    p.slug as puzzle_slug,
    p.title as puzzle_title,
    a.completed_at,
    a.duration_ms,
    (select count(*)::integer from attempt_hints h where h.attempt_id = a.id) as hints
  from attempts a
  join puzzles p on p.id = a.puzzle_id
  join puzzle_types t on t.key = a.type_key
  where a.completed_at is not null and a.duration_ms is not null
`);

export const userCategoryStats = pgView("user_category_stats", {
  userId: uuid("user_id").notNull(),
  categoryKey: text("category_key").notNull(),
  categoryName: text("category_name").notNull(),
  categorySort: smallint("category_sort").notNull(),
  solves: integer("solves").notNull(),
  medianDurationMs: integer("median_duration_ms").notNull(),
  bestDurationMs: integer("best_duration_ms").notNull(),
  avgHints: numeric("avg_hints", { precision: 10, scale: 2 }).notNull(),
}).as(sql`
  select
    s.user_id,
    s.category_key,
    c.name as category_name,
    c.sort as category_sort,
    count(*)::integer as solves,
    round(percentile_cont(0.5) within group (order by s.duration_ms))::integer as median_duration_ms,
    min(s.duration_ms) as best_duration_ms,
    round(avg(s.hints), 2) as avg_hints
  from user_solves s
  join puzzle_categories c on c.key = s.category_key
  group by s.user_id, s.category_key, c.name, c.sort
`);

export const userStreaks = pgView("user_streaks", {
  userId: uuid("user_id").notNull(),
  currentStreak: integer("current_streak").notNull(),
  longestStreak: integer("longest_streak").notNull(),
}).as(sql`
  with days as (
    select distinct user_id, (completed_at at time zone 'Europe/London')::date as day
    from user_solves
  ),
  islands as (
    select user_id, day, day - (row_number() over (partition by user_id order by day))::integer as island
    from days
  ),
  runs as (
    select user_id, max(day) as last_day, count(*)::integer as length
    from islands
    group by user_id, island
  )
  select
    user_id,
    coalesce(max(length) filter (where last_day >= (now() at time zone 'Europe/London')::date - 1), 0)::integer as current_streak,
    max(length)::integer as longest_streak
  from runs
  group by user_id
`);
