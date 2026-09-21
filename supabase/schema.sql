-- TaskFlow Supabase schema (v1.6.0)
-- Safe to run on a new Supabase project.

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;

create table if not exists public.taskflow_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schedule jsonb not null default '{"0":"off","1":"office","2":"home","3":"office","4":"home","5":"home","6":"off"}'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  location_overrides jsonb not null default '{}'::jsonb,
  last_location text not null default 'home' check (last_location in ('home','office')),
  daily_minimum numeric not null default 0,
  timezone text not null default 'Asia/Tashkent',
  workday_start text not null default '10:00',
  workday_end text not null default '18:00',
  last_workday_ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.taskflow_settings
  add column if not exists location_overrides jsonb not null default '{}'::jsonb,
  add column if not exists last_location text not null default 'home',
  add column if not exists daily_minimum numeric not null default 0,
  add column if not exists timezone text not null default 'Asia/Tashkent',
  add column if not exists workday_start text not null default '10:00',
  add column if not exists workday_end text not null default '18:00',
  add column if not exists last_workday_ended_at timestamptz;

create table if not exists public.taskflow_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  types text[] not null default '{}',
  category text not null default '',
  plan_by_type jsonb not null default '{}'::jsonb,
  deadline date,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','progress','paused','done')),
  last_work_type text not null default '',
  last_work_operation text not null default 'create' check (last_work_operation in ('create','add','edit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists taskflow_tasks_user_status_idx
  on public.taskflow_tasks (user_id, status);
create index if not exists taskflow_tasks_user_completed_idx
  on public.taskflow_tasks (user_id, completed_at desc);

create table if not exists public.taskflow_work_sessions (
  id text primary key,
  task_id text not null references public.taskflow_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('attribute','product','description','page')),
  operation text not null check (operation in ('create','add','edit')),
  location text not null check (location in ('home','office')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms bigint
);

create index if not exists taskflow_sessions_user_started_idx
  on public.taskflow_work_sessions (user_id, started_at desc);

create table if not exists public.taskflow_actions (
  id text primary key,
  task_id text not null references public.taskflow_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('attribute','product','description','page')),
  operation text not null check (operation in ('create','add','edit')),
  page_title text not null default '',
  url text not null,
  location text check (location in ('home','office')),
  units numeric not null default 1,
  work_session_id text,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

alter table public.taskflow_actions
  add column if not exists work_session_id text;

create index if not exists taskflow_actions_user_created_idx
  on public.taskflow_actions (user_id, created_at desc);
create index if not exists taskflow_actions_task_created_idx
  on public.taskflow_actions (task_id, created_at desc);

create table if not exists public.taskflow_breaks (
  id text primary key,
  task_id text not null references public.taskflow_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('break','lunch','personal')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms bigint
);

create table if not exists public.taskflow_manager_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists taskflow_manager_links_user_idx
  on public.taskflow_manager_links (user_id, active);

alter table public.taskflow_settings enable row level security;
alter table public.taskflow_tasks enable row level security;
alter table public.taskflow_actions enable row level security;
alter table public.taskflow_work_sessions enable row level security;
alter table public.taskflow_breaks enable row level security;
alter table public.taskflow_manager_links enable row level security;

drop policy if exists "settings owner access" on public.taskflow_settings;
drop policy if exists "tasks owner access" on public.taskflow_tasks;
drop policy if exists "actions owner access" on public.taskflow_actions;
drop policy if exists "sessions owner access" on public.taskflow_work_sessions;
drop policy if exists "breaks owner access" on public.taskflow_breaks;
drop policy if exists "manager links owner access" on public.taskflow_manager_links;

create policy "settings owner access" on public.taskflow_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks owner access" on public.taskflow_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "actions owner access" on public.taskflow_actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions owner access" on public.taskflow_work_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "breaks owner access" on public.taskflow_breaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manager links owner access" on public.taskflow_manager_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.taskflow_settings to authenticated;
grant select, insert, update, delete on public.taskflow_tasks to authenticated;
grant select, insert, update, delete on public.taskflow_actions to authenticated;
grant select, insert, update, delete on public.taskflow_work_sessions to authenticated;
grant select, insert, update, delete on public.taskflow_breaks to authenticated;
grant select, insert, update, delete on public.taskflow_manager_links to authenticated;

-- Creates a new opaque public token. Only the SHA-256 hash is stored.
create or replace function public.taskflow_create_manager_link()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.taskflow_manager_links
    set active = false, revoked_at = now()
    where user_id = auth.uid() and active = true;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.taskflow_manager_links (user_id, token_hash)
  values (auth.uid(), encode(extensions.digest(raw_token, 'sha256'), 'hex'));

  return raw_token;
end;
$$;

-- Public read-only payload for the manager page.
-- Intentionally excludes work_sessions, breaks and planned minutes.
create or replace function public.taskflow_manager_snapshot(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  owner_timezone text := 'Asia/Tashkent';
  payload jsonb;
begin
  select user_id into owner_id
  from public.taskflow_manager_links
  where active = true
    and token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
  limit 1;

  if owner_id is null then
    return jsonb_build_object('authorized', false);
  end if;

  select coalesce(s.timezone, 'Asia/Tashkent') into owner_timezone
  from public.taskflow_settings s
  where s.user_id = owner_id;

  owner_timezone := coalesce(owner_timezone, 'Asia/Tashkent');

  select jsonb_build_object(
    'authorized', true,
    'todayLocation', (
      select a.location
      from public.taskflow_actions a
      where a.user_id = owner_id
        and (a.created_at at time zone owner_timezone)::date = (now() at time zone owner_timezone)::date
      order by a.created_at desc
      limit 1
    ),
    'settings', coalesce((
      select jsonb_build_object(
        'schedule', s.schedule,
        'categories', s.categories,
        'timezone', s.timezone,
        'workdayStart', s.workday_start,
        'workdayEnd', s.workday_end,
        'workdayEndedToday', case
          when s.last_workday_ended_at is null then false
          else (s.last_workday_ended_at at time zone owner_timezone)::date = (now() at time zone owner_timezone)::date
        end
      )
      from public.taskflow_settings s
      where s.user_id = owner_id
    ), jsonb_build_object(
      'schedule', '{}'::jsonb,
      'categories', '[]'::jsonb,
      'timezone', owner_timezone,
      'workdayStart', '10:00',
      'workdayEnd', '18:00',
      'workdayEndedToday', false
    )),
    'tasks', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'title', t.title,
          'types', to_jsonb(t.types),
          'category', t.category,
          'planByType', coalesce((
            select jsonb_object_agg(plan.key, jsonb_build_object('units', plan.value -> 'units'))
            from jsonb_each(t.plan_by_type) as plan
          ), '{}'::jsonb),
          'deadline', t.deadline,
          'status', t.status,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at,
          'completedAt', t.completed_at,
          'actions', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', a.id,
                'type', a.type,
                'action', a.operation,
                'pageTitle', a.page_title,
                'url', a.url,
                'location', a.location,
                'units', a.units,
                'createdAt', a.created_at,
                'editedAt', a.edited_at
              ) order by a.created_at desc
            )
            from public.taskflow_actions a
            where a.task_id = t.id
          ), '[]'::jsonb)
        ) order by t.updated_at desc
      )
      from public.taskflow_tasks t
      where t.user_id = owner_id
    ), '[]'::jsonb)
  ) into payload;

  return payload;
end;
$$;

grant execute on function public.taskflow_manager_snapshot(text) to anon, authenticated;
grant execute on function public.taskflow_create_manager_link() to authenticated;
