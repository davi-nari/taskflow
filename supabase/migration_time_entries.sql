create table if not exists public.taskflow_time_entries (
 id text primary key,
 user_id uuid not null,
 type text not null default 'work',
 task_id text,
 started_at timestamptz,
 ended_at timestamptz,
 duration_ms bigint,
 location text,
 actions_count integer default 0,
 note text,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

alter table public.taskflow_time_entries enable row level security;

create policy if not exists "own time entries" on public.taskflow_time_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
