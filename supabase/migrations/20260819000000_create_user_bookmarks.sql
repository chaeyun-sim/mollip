-- user_bookmarks: 사용자별 전시 북마크 (기기 간 동기화)
create table if not exists public.user_bookmarks (
  user_id       uuid not null references auth.users(id) on delete cascade,
  exhibition_id text not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

alter table public.user_bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.user_bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.user_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.user_bookmarks for delete
  using (auth.uid() = user_id);

comment on table public.user_bookmarks is '사용자 전시 북마크 — toggle 시 upsert/delete, 로그인 시 hydration';
