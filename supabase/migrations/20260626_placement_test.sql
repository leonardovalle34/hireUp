ALTER TABLE profiles ADD COLUMN IF NOT EXISTS placement_test_done boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS placement_test_done_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_user_dashboard(uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  lessons_today integer;
  user_plan text;
  user_name text;
  user_email text;
  user_created_at timestamptz;
  avg_score numeric;
  streak integer;
  weekly_count integer;
  recent_sessions json;
  weekly_chart json;
  score_chart json;
  active_days json;
  daily_limit integer;
  remaining_today integer;
begin
  select plan, name into user_plan, user_name
  from profiles where id = uid;

  select email, created_at::timestamptz into user_email, user_created_at
  from auth.users where id = uid;

  select count(*) into lessons_today
  from lesson_sessions
  where user_id = uid
  and created_at::date = current_date;

  daily_limit := case
    when user_plan in ('pro', 'fluent') then null
    when user_plan = 'practice' then 1
    else 1
  end;

  remaining_today := case
    when daily_limit is null then null
    else greatest(0, daily_limit - lessons_today)
  end;

  select round(avg(score), 1) into avg_score
  from lesson_sessions
  where user_id = uid and score is not null;

  select count(*) into weekly_count
  from lesson_sessions
  where user_id = uid
  and created_at::date >= date_trunc('week', current_date)::date;

  with daily as (
    select distinct created_at::date as day
    from lesson_sessions where user_id = uid
  ),
  streak_calc as (
    select day, day - (row_number() over (order by day))::integer as grp
    from daily
  ),
  groups as (
    select grp, max(day) as last_day, count(*) as cnt
    from streak_calc group by grp
  )
  select coalesce(
    (select cnt from groups where last_day >= current_date - 1 order by last_day desc limit 1), 0
  ) into streak;

  select json_agg(r) into recent_sessions
  from (
    select ls.id, ls.score,
      to_char(ls.created_at, 'DD/MM/YYYY') as date
    from lesson_sessions ls
    where ls.user_id = uid
    order by ls.created_at desc limit 5
  ) r;

  select json_agg(r order by r.day) into weekly_chart
  from (
    select
      to_char(d::date, 'Dy') as label,
      d::date as day,
      coalesce(count(ls.id), 0) as count
    from generate_series(current_date - 6, current_date, '1 day'::interval) d
    left join lesson_sessions ls
      on ls.user_id = uid
      and ls.created_at::date = d::date
    group by d
  ) r;

  select json_agg(r) into score_chart
  from (
    select
      score,
      to_char(created_at, 'DD/MM') as date,
      row_number() over (order by created_at) as idx
    from lesson_sessions
    where user_id = uid and score is not null
    order by created_at desc limit 10
  ) r;

  select json_agg(day) into active_days
  from (
    select distinct created_at::date as day
    from lesson_sessions
    where user_id = uid
    and created_at::date >= current_date - 29
  ) r;

  return json_build_object(
    'name', user_name,
    'email', user_email,
    'created_at', to_char(user_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'plan', user_plan,
    'english_level', (select english_level from profiles where id = uid),
    'placement_test_done', (select coalesce(placement_test_done, false) from profiles where id = uid),
    'placement_test_done_at', (select placement_test_done_at from profiles where id = uid),
    'lessons_today', lessons_today,
    'weekly_count', weekly_count,
    'avg_score', coalesce(avg_score, 0),
    'streak', coalesce(streak, 0),
    'recent_sessions', coalesce(recent_sessions, '[]'::json),
    'weekly_chart', coalesce(weekly_chart, '[]'::json),
    'score_chart', coalesce(score_chart, '[]'::json),
    'active_days', coalesce(active_days, '[]'::json),
    'limit', daily_limit,
    'remaining', remaining_today
  );
end;
$function$
