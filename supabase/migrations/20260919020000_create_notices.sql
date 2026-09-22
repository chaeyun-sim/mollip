-- notices: 공지사항. 등록은 Supabase 대시보드 Table Editor에서 직접 (별도 관리자 UI 없음).
create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;

create policy "Anyone can read notices"
  on public.notices for select
  using (true);

comment on table public.notices is '공지사항 — 등록/수정/삭제는 Supabase 대시보드에서 직접 수행';
