-- 문화포털/KCISA API 모두 커버하지 못하는 소규모 갤러리 등의 전시 정보를
-- 직접 입력해 채워 넣기 위한 수동 큐레이션 테이블.
-- venue_name은 지도 마커의 venueName(미술관 API culName 등)과 정확히 일치해야 매칭된다.

create table public.manual_exhibitions (
  id                text primary key default gen_random_uuid()::text,
  venue_name        text not null,
  title             text not null,
  genre             text not null default '전시',
  description       text not null default '',
  image_url         text,
  url               text,
  artist            text,
  phone             text,
  admission         text not null default '정보 없음',
  admission_free    boolean not null default false,
  start_date        text not null,
  end_date          text not null,
  open_hours        text not null default '운영시간 정보 없음',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index manual_exhibitions_venue_name_idx on public.manual_exhibitions (venue_name);

alter table public.manual_exhibitions enable row level security;

create policy "manual_exhibitions_public_read"
  on public.manual_exhibitions
  for select
  to anon, authenticated
  using (true);
