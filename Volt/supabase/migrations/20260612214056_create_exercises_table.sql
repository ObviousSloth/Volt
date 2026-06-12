-- Sprint 1: exercises table with public-read RLS.
-- secondary_muscles added beyond the base spec: volt-data.js ships secondary
-- muscle data and the Exercise Detail screen renders primary/secondary bars.

create table public.exercises (
  id          text primary key check (char_length(id) <= 64),
  name        text not null check (char_length(name) <= 120),
  muscle      text check (char_length(muscle) <= 50),
  body_part   text check (char_length(body_part) <= 50),
  equipment   text check (char_length(equipment) <= 50),
  met_value   numeric(4,1) default 5.0 check (met_value > 0),
  gif_url     text check (char_length(gif_url) <= 500),
  instructions text[],
  secondary_muscles text[],
  is_custom   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.exercises enable row level security;

-- Public read; intentionally no INSERT/UPDATE/DELETE policies — writes happen
-- only via the get-exercises edge function (service role) and seed migrations.
create policy "exercises are public read"
  on public.exercises for select
  using (true);

create index exercises_muscle_idx on public.exercises (muscle);
create index exercises_body_part_idx on public.exercises (body_part);
create index exercises_equipment_idx on public.exercises (equipment);
