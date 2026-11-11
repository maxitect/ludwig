CREATE VIEW "user_type_activity" AS (
  with touched as (
    select a.user_id, a.type_key, (v.at_time at time zone 'Europe/London')::date as day
    from attempts a
    cross join lateral (values (a.started_at), (a.last_saved_at), (a.completed_at)) as v(at_time)
    where v.at_time is not null
  ),
  days as (
    select
      user_id,
      type_key,
      min(day) as first_day,
      max(day) as last_day,
      count(distinct day)::integer as active_days
    from touched
    group by user_id, type_key
  ),
  counts as (
    select
      a.user_id,
      a.type_key,
      count(*)::integer as started,
      (count(*) filter (where a.completed_at is not null))::integer as completed,
      (count(*) filter (where a.completed_at is null))::integer as unfinished,
      (count(*) filter (where a.completed_at is null and a.last_saved_at < now() - interval '7 days'))::integer as stale_unfinished,
      (count(*) filter (where exists (
        select 1 from attempts earlier
        where earlier.user_id = a.user_id
          and earlier.type_key = a.type_key
          and earlier.completed_at < a.started_at
      )))::integer as returns_after_solve
    from attempts a
    group by a.user_id, a.type_key
  )
  select
    d.user_id,
    d.type_key,
    d.first_day,
    d.last_day,
    d.active_days,
    c.started,
    c.completed,
    c.unfinished,
    c.stale_unfinished,
    c.returns_after_solve
  from days d
  join counts c on c.user_id = d.user_id and c.type_key = d.type_key
);