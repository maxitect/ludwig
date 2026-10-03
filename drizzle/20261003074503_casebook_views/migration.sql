CREATE VIEW "user_solves" AS (
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
);
--> statement-breakpoint
CREATE VIEW "user_category_stats" AS (
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
);
--> statement-breakpoint
CREATE VIEW "user_streaks" AS (
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
);