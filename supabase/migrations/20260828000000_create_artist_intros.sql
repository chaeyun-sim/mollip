-- artist_intros: 작가 소개 인트로 해설의 전역 캐시
-- artist 문자열을 키로 모든 사용자·모든 세션이 결과를 재사용한다(개인화 요소 없음).
-- 선례: artist_artworks (작가명 키 + 전역 캐시 + 클라이언트 upsert)
create table if not exists public.artist_intros (
  artist     text primary key,
  intro      text not null,
  updated_at timestamptz not null default now()
);

comment on table public.artist_intros is
  '작가 소개 인트로 해설 전역 캐시 — artist 원문 문자열이 PK. 개인화 없음';

alter table public.artist_intros enable row level security;

-- 캐시가 전역이므로 비로그인 사용자를 포함해 누구나 읽고 쓸 수 있어야 한다.
-- 읽기 정책이 없으면 캐시 히트가 영구히 발생하지 않아 매번 재생성되는 조용한 실패가 된다.
create policy "Anyone can read artist intros"
  on public.artist_intros for select
  using (true);

create policy "Anyone can insert artist intros"
  on public.artist_intros for insert
  with check (true);

create policy "Anyone can update artist intros"
  on public.artist_intros for update
  using (true)
  with check (true);
