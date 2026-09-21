
alter table public.taskflow_actions
add column if not exists exported_to_sheet boolean not null default false,
add column if not exists exported_at timestamptz;
