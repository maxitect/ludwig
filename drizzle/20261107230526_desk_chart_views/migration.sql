CREATE VIEW "user_daily_solves" AS (
  select
    user_id,
    (completed_at at time zone 'Europe/London')::date as day,
    count(*)::integer as solves,
    sum(duration_ms)::bigint as total_duration_ms
  from user_solves
  group by user_id, (completed_at at time zone 'Europe/London')::date
);--> statement-breakpoint
CREATE VIEW "user_difficulty_stats" AS (
  select
    s.user_id,
    p.difficulty,
    count(*)::integer as solves,
    round(percentile_cont(0.5) within group (order by s.duration_ms))::integer as median_duration_ms
  from user_solves s
  join puzzles p on p.id = s.puzzle_id
  group by s.user_id, p.difficulty
);--> statement-breakpoint
CREATE VIEW "user_type_stats" AS (
  select
    user_id,
    type_key,
    type_name,
    category_key,
    count(*)::integer as solves,
    round(percentile_cont(0.5) within group (order by duration_ms))::integer as median_duration_ms,
    min(duration_ms) as best_duration_ms,
    round(avg(hints), 2) as avg_hints,
    max(completed_at) as last_solved_at
  from user_solves
  group by user_id, type_key, type_name, category_key
);