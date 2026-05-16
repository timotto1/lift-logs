-- ============================================================
-- Lift Log schema
-- Run this once in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- Sessions: one row per completed workout
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  workout_id int not null check (workout_id between 1 and 4),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  duration_minutes int,
  created_at timestamptz default now()
);

create index if not exists sessions_user_finished_idx
  on sessions(user_id, finished_at desc);

-- Set logs: one row per logged set
create table if not exists set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade not null,
  user_id uuid references auth.users not null,
  exercise_id text not null,
  set_number int not null,
  weight numeric,
  reps int,
  completed boolean default true,
  created_at timestamptz default now()
);

create index if not exists set_logs_user_exercise_idx
  on set_logs(user_id, exercise_id, created_at desc);

create index if not exists set_logs_session_idx
  on set_logs(session_id);

-- Row-level security: you only see your own data
alter table sessions enable row level security;
alter table set_logs enable row level security;

drop policy if exists "own sessions select" on sessions;
drop policy if exists "own sessions insert" on sessions;
drop policy if exists "own sessions update" on sessions;
drop policy if exists "own sessions delete" on sessions;

create policy "own sessions select" on sessions
  for select using (auth.uid() = user_id);
create policy "own sessions insert" on sessions
  for insert with check (auth.uid() = user_id);
create policy "own sessions update" on sessions
  for update using (auth.uid() = user_id);
create policy "own sessions delete" on sessions
  for delete using (auth.uid() = user_id);

drop policy if exists "own sets select" on set_logs;
drop policy if exists "own sets insert" on set_logs;
drop policy if exists "own sets update" on set_logs;
drop policy if exists "own sets delete" on set_logs;

create policy "own sets select" on set_logs
  for select using (auth.uid() = user_id);
create policy "own sets insert" on set_logs
  for insert with check (auth.uid() = user_id);
create policy "own sets update" on set_logs
  for update using (auth.uid() = user_id);
create policy "own sets delete" on set_logs
  for delete using (auth.uid() = user_id);
