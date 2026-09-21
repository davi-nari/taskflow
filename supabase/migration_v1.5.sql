-- TaskFlow v1.4.x -> v1.5.0 Supabase migration
-- Run this once if you already executed the older schema.sql.

alter table public.taskflow_settings
  add column if not exists location_overrides jsonb not null default '{}'::jsonb,
  add column if not exists last_location text not null default 'home',
  add column if not exists daily_minimum numeric not null default 0,
  add column if not exists timezone text not null default 'Asia/Tashkent';

alter table public.taskflow_actions
  add column if not exists work_session_id text;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.taskflow_settings to authenticated;
grant select, insert, update, delete on public.taskflow_tasks to authenticated;
grant select, insert, update, delete on public.taskflow_actions to authenticated;
grant select, insert, update, delete on public.taskflow_work_sessions to authenticated;
grant select, insert, update, delete on public.taskflow_breaks to authenticated;
grant select, insert, update, delete on public.taskflow_manager_links to authenticated;

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
      select jsonb_build_object('schedule', s.schedule, 'categories', s.categories, 'timezone', s.timezone)
      from public.taskflow_settings s
      where s.user_id = owner_id
    ), jsonb_build_object('schedule', '{}'::jsonb, 'categories', '[]'::jsonb, 'timezone', owner_timezone)),
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
