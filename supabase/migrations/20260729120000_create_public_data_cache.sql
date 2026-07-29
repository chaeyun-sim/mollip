-- 공공데이터(문화포털 목록, 미술관 목록)를 클라이언트가 매번 라이브로 호출하는 대신,
-- Supabase에 캐싱해서 서빙한다. data_sync_meta로 소스별 마지막 동기화 시각을 추적하고,
-- 24시간 이상 지나면 클라이언트가 공공API를 다시 호출해 upsert한 뒤 갱신한다.

create table public.data_sync_meta (
  source      text primary key,
  synced_at   timestamptz not null default now()
);

alter table public.data_sync_meta enable row level security;

create policy "data_sync_meta_public_read"
  on public.data_sync_meta for select to anon, authenticated using (true);
create policy "data_sync_meta_public_insert"
  on public.data_sync_meta for insert to anon, authenticated with check (true);
create policy "data_sync_meta_public_update"
  on public.data_sync_meta for update to anon, authenticated using (true) with check (true);

create table public.museums (
  seq            text primary key,
  cul_name       text not null,
  cul_grp_name   text,
  cul_tel        text,
  cul_home_url   text,
  gps_x          text,
  gps_y          text,
  updated_at     timestamptz not null default now()
);

alter table public.museums enable row level security;

create policy "museums_public_read"
  on public.museums for select to anon, authenticated using (true);
create policy "museums_public_insert"
  on public.museums for insert to anon, authenticated with check (true);
create policy "museums_public_update"
  on public.museums for update to anon, authenticated using (true) with check (true);

create table public.culture_exhibitions (
  seq            text primary key,
  title          text not null,
  start_date     text,
  end_date       text,
  place          text,
  realm_name     text,
  area           text,
  thumbnail      text,
  gps_x          text,
  gps_y          text,
  sigungu        text,
  service_name   text,
  updated_at     timestamptz not null default now()
);

alter table public.culture_exhibitions enable row level security;

create policy "culture_exhibitions_public_read"
  on public.culture_exhibitions for select to anon, authenticated using (true);
create policy "culture_exhibitions_public_insert"
  on public.culture_exhibitions for insert to anon, authenticated with check (true);
create policy "culture_exhibitions_public_update"
  on public.culture_exhibitions for update to anon, authenticated using (true) with check (true);
