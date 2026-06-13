-- Previous-performance lookup: the most recent COMPLETED workout for a given
-- exercise belonging to the authenticated user, excluding an optional in-progress
-- session. Returns the sets of that most-recent prior session (so the UI can show
-- a "PREV" column per set).
--
-- SECURITY INVOKER (the default): the function runs with the caller's privileges,
-- so RLS on workout_sets/workout_sessions still applies as a backstop and the
-- function can only ever see the caller's own rows. We ALSO filter explicitly on
-- auth.uid() so the intent is clear and the function is correct even if called in
-- a context where RLS were somehow relaxed.
create or replace function public.previous_exercise_sets(
  p_exercise_id text,
  p_exclude_session uuid default null
)
returns table (
  session_id   uuid,
  started_at   timestamptz,
  set_number   integer,
  reps         integer,
  weight_kg    numeric(5,2),
  completed_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with last_session as (
    select ws.session_id, s.started_at
    from public.workout_sets ws
    join public.workout_sessions s on s.id = ws.session_id
    where ws.exercise_id = p_exercise_id
      and s.user_id = auth.uid()
      and ws.completed_at is not null
      and (p_exclude_session is null or ws.session_id <> p_exclude_session)
    order by s.started_at desc, ws.completed_at desc
    limit 1
  )
  select ws.session_id, ls.started_at, ws.set_number, ws.reps, ws.weight_kg, ws.completed_at
  from public.workout_sets ws
  join last_session ls on ls.session_id = ws.session_id
  where ws.completed_at is not null
  order by ws.set_number asc;
$$;

-- Only signed-in users may call this; anon has no business asking for a user's
-- performance history (and auth.uid() would be null for it anyway).
revoke all on function public.previous_exercise_sets(text, uuid) from public;
revoke all on function public.previous_exercise_sets(text, uuid) from anon;
grant execute on function public.previous_exercise_sets(text, uuid) to authenticated;
