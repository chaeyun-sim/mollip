-- venue_follows: 사용자별 관심 전시관. 새 전시 알림 구독의 서버 정본이다.
create table if not exists public.venue_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  museum_id  bigint not null references public.museums(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, museum_id)
);

alter table public.venue_follows enable row level security;

create policy "Users can read own venue follows"
  on public.venue_follows for select
  using (auth.uid() = user_id);

create policy "Users can insert own venue follows"
  on public.venue_follows for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own venue follows"
  on public.venue_follows for delete
  using (auth.uid() = user_id);

comment on table public.venue_follows is '사용자별 관심 전시관 — 새 전시 알림 구독의 서버 정본';
