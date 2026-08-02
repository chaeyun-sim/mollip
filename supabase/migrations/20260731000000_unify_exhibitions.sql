-- kcisa_exhibitions/manual_exhibitions/culture_exhibitions/museums로 흩어져 있던 전시·미술관
-- 데이터를 exhibitions/museums 두 테이블로 통합한다.
--
-- museums: 미술관 자체 정보 (source='api'는 공공 미술관 목록 API 자동 동기화, source='manual'은
--          API에 없는 소규모 갤러리를 직접 추가한 것).
-- exhibitions: 모든 전시 (source='kcisa'|'culture'|'manual'). museum_id는 known museum과 연결된
--          경우에만 채워지고, 없으면 venue_name_fallback 텍스트만으로 표시된다 (nullable FK).

-- 구 museums(공공 미술관 목록 캐시)는 24시간마다 통째로 재동기화되는 캐시라 이관할 가치가 없다.
-- 새 스키마로 즉시 교체한다.
drop table public.museums;

create table public.museums (
  id            text primary key,
  source        text not null check (source in ('api', 'manual')),
  name          text not null,
  address       text,
  phone         text,
  homepage_url  text,
  gps_x         text,
  gps_y         text,
  open_hours    text,
  synced_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.museums enable row level security;

create policy "museums_public_read" on public.museums
  for select to anon, authenticated using (true);
create policy "museums_public_insert" on public.museums
  for insert to anon, authenticated with check (true);
create policy "museums_public_update" on public.museums
  for update to anon, authenticated using (true) with check (true);

create table public.exhibitions (
  id                  text primary key,
  source              text not null check (source in ('kcisa', 'culture', 'manual')),
  museum_id           text references public.museums (id),
  venue_name_fallback text not null,
  event_site          text,
  title               text not null,
  start_date          text not null,
  end_date            text not null,
  artist              text,
  curator             text,
  curator_note        text,
  description         text not null default '',
  image_url           text,
  genre               text not null default '전시',
  open_hours          text not null default '운영시간 정보 없음',
  closed_days         text,
  admission           text not null default '정보 없음',
  admission_free      boolean not null default false,
  ticket_url          text,
  phone               text,
  tags                text[],
  area                text,
  sigungu             text,
  collected_date      text,
  synced_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index exhibitions_museum_id_idx on public.exhibitions (museum_id);
create index exhibitions_venue_name_fallback_idx on public.exhibitions (venue_name_fallback);
create index exhibitions_source_idx on public.exhibitions (source);

alter table public.exhibitions enable row level security;

create policy "exhibitions_public_read" on public.exhibitions
  for select to anon, authenticated using (true);
create policy "exhibitions_public_insert" on public.exhibitions
  for insert to anon, authenticated with check (true);
create policy "exhibitions_public_update" on public.exhibitions
  for update to anon, authenticated using (true) with check (true);

-- 기존 kcisa_exhibitions 시드 데이터를 exhibitions로 이관.
-- period("2026-07-10~2027-10-31")를 start_date/end_date로 미리 분해해두어
-- 읽는 쪽 mapper가 매번 문자열을 파싱하지 않아도 되게 한다.
insert into public.exhibitions (
  id, source, venue_name_fallback, event_site, title, start_date, end_date,
  artist, description, image_url, genre, open_hours, admission, admission_free,
  ticket_url, phone, tags, collected_date, synced_at
)
select
  'kcisa-' || id,
  'kcisa',
  coalesce(nullif(trim(institution), ''), nullif(trim(event_site), ''), '장소 정보 없음'),
  event_site,
  title,
  replace(split_part(coalesce(period, ''), '~', 1), '-', '.'),
  replace(split_part(coalesce(period, ''), '~', 2), '-', '.'),
  author,
  coalesce(description, ''),
  image_url,
  coalesce(nullif(trim(genre), ''), '전시'),
  coalesce(nullif(trim(event_period), ''), '운영시간 정보 없음'),
  coalesce(nullif(trim(charge), ''), '정보 없음'),
  coalesce(charge = '0' or charge ilike '%무료%', false),
  url,
  contact_point,
  case when genre is not null and trim(genre) <> '' then array[genre] else null end,
  collected_date,
  now()
from public.kcisa_exhibitions;

-- manual_exhibitions 이관
insert into public.exhibitions (
  id, source, venue_name_fallback, title, start_date, end_date, artist,
  description, image_url, genre, open_hours, admission, admission_free,
  ticket_url, phone
)
select
  'manual-' || id,
  'manual',
  venue_name,
  title,
  start_date,
  end_date,
  artist,
  description,
  image_url,
  genre,
  open_hours,
  admission,
  admission_free,
  url,
  phone
from public.manual_exhibitions;

-- culture_exhibitions는 24시간마다 통째로 재동기화되는 얇은 캐시(홈 화면 추천용)라
-- 과거 행을 이관할 가치가 없다. 테이블만 정리하고, data_sync_meta를 리셋해 다음 로드 때
-- 새 exhibitions 스키마로 다시 채워지게 한다.
drop table public.culture_exhibitions;
drop table public.kcisa_exhibitions;
drop table public.manual_exhibitions;

delete from public.data_sync_meta where source in ('museums', 'culture_realm');
