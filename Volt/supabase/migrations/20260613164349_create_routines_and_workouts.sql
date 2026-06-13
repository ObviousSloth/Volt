-- Sprint 2: routines, routine_exercises, workout_sessions, workout_sets.
-- Owner-only RLS on all four. routines/workout_sessions own via auth.uid() = user_id
-- on USING and WITH CHECK; routine_exercises/workout_sets own via their parent
-- (routine_id -> routines, session_id -> workout_sessions) on USING and WITH CHECK.
-- DB-level CHECK bounds per Team/security-review.md Sprint 2 standards.

-- ---------------------------------------------------------------------------
-- routines: a user-owned named workout template.
-- ---------------------------------------------------------------------------
create table public.routines (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) <= 120),
  description   text check (char_length(description) <= 2000),
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "routines: owner select"
  on public.routines for select
  using (auth.uid() = user_id);
create policy "routines: owner insert"
  on public.routines for insert
  with check (auth.uid() = user_id);
create policy "routines: owner update"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "routines: owner delete"
  on public.routines for delete
  using (auth.uid() = user_id);

create index routines_user_id_idx on public.routines (user_id);

-- ---------------------------------------------------------------------------
-- routine_exercises: an exercise entry within a routine (ordered, with target
-- prescription). Owned via the parent routine.
-- ---------------------------------------------------------------------------
create table public.routine_exercises (
  id            uuid primary key default gen_random_uuid(),
  routine_id    uuid not null references public.routines(id) on delete cascade,
  exercise_id   text not null references public.exercises(id),
  sets          integer not null default 3 check (sets >= 1 and sets <= 99),
  reps          integer not null default 10 check (reps >= 0 and reps <= 999),
  weight_kg     numeric(5,2) check (weight_kg >= 0 and weight_kg <= 999.99),
  rest_seconds  integer not null default 90 check (rest_seconds >= 0 and rest_seconds <= 3600),
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.routine_exercises enable row level security;

create policy "routine_exercises: owner select"
  on public.routine_exercises for select
  using (exists (
    select 1 from public.routines r
    where r.id = routine_id and r.user_id = auth.uid()
  ));
create policy "routine_exercises: owner insert"
  on public.routine_exercises for insert
  with check (exists (
    select 1 from public.routines r
    where r.id = routine_id and r.user_id = auth.uid()
  ));
create policy "routine_exercises: owner update"
  on public.routine_exercises for update
  using (exists (
    select 1 from public.routines r
    where r.id = routine_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.routines r
    where r.id = routine_id and r.user_id = auth.uid()
  ));
create policy "routine_exercises: owner delete"
  on public.routine_exercises for delete
  using (exists (
    select 1 from public.routines r
    where r.id = routine_id and r.user_id = auth.uid()
  ));

create index routine_exercises_routine_id_idx on public.routine_exercises (routine_id);
create index routine_exercises_exercise_id_idx on public.routine_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- workout_sessions: a single performed workout (may be in-progress).
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  routine_id    uuid references public.routines(id) on delete set null,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  notes         text check (char_length(notes) <= 2000),
  created_at    timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions: owner select"
  on public.workout_sessions for select
  using (auth.uid() = user_id);
create policy "workout_sessions: owner insert"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);
create policy "workout_sessions: owner update"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "workout_sessions: owner delete"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

create index workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index workout_sessions_routine_id_idx on public.workout_sessions (routine_id);

-- ---------------------------------------------------------------------------
-- workout_sets: a single logged set within a session. Owned via parent session.
-- ---------------------------------------------------------------------------
create table public.workout_sets (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id   text not null references public.exercises(id),
  set_number    integer not null check (set_number >= 1 and set_number <= 99),
  reps          integer check (reps >= 0 and reps <= 999),
  weight_kg     numeric(5,2) check (weight_kg >= 0 and weight_kg <= 999.99),
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.workout_sets enable row level security;

create policy "workout_sets: owner select"
  on public.workout_sets for select
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy "workout_sets: owner insert"
  on public.workout_sets for insert
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy "workout_sets: owner update"
  on public.workout_sets for update
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
create policy "workout_sets: owner delete"
  on public.workout_sets for delete
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));

create index workout_sets_session_id_idx on public.workout_sets (session_id);
create index workout_sets_exercise_id_idx on public.workout_sets (exercise_id);
