-- 작가명으로 Wikidata에서 조회한 대표작(최대 4개)을 캐싱한다.
-- 최초 조회 시 클라이언트가 Wikidata를 호출해 채워 넣고, 이후로는 이 테이블에서 즉시 반환한다.
-- 작품을 찾지 못한 작가도 artworks를 빈 배열로 캐싱해 매번 재검색하지 않도록 한다.

create table public.artist_artworks (
  artist       text primary key,
  artworks     jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.artist_artworks enable row level security;

create policy "artist_artworks_public_read"
  on public.artist_artworks
  for select
  to anon, authenticated
  using (true);

-- 캐시를 채우는 주체가 별도 백엔드가 아니라 클라이언트 자신이므로, 쓰기도 공개로 둔다.
-- (Phase C에서 공공데이터 캐시를 Edge Function으로 옮길 때 이 테이블도 함께 재검토한다.)
create policy "artist_artworks_public_insert"
  on public.artist_artworks
  for insert
  to anon, authenticated
  with check (true);

create policy "artist_artworks_public_update"
  on public.artist_artworks
  for update
  to anon, authenticated
  using (true)
  with check (true);
