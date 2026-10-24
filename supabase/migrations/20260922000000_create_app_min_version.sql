-- app_min_version: 강제 업데이트 최소 버전. platform별 1행. 값 변경은 Supabase 대시보드에서 직접 수행.
create table if not exists public.app_min_version (
  platform    text primary key check (platform in ('ios', 'android')),
  min_version text not null,
  store_url   text,
  updated_at  timestamptz not null default now()
);

alter table public.app_min_version enable row level security;

create policy "Anyone can read app_min_version"
  on public.app_min_version for select
  using (true);

insert into public.app_min_version (platform, min_version) values
  ('ios', '1.0.0'),
  ('android', '1.0.0')
on conflict (platform) do nothing;

comment on table public.app_min_version is '강제 업데이트 최소 버전 — 값·store_url 변경은 Supabase 대시보드에서 직접 수행';
