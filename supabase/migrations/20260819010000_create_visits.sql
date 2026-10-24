-- visits: 사용자별 하루 관람 기록
create table if not exists public.visits (
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  exhibition_id integer references public.exhibitions(id) on delete set null,
  memo          text,
  primary key (user_id, date)
);

alter table public.visits enable row level security;

create policy "Users can read own visits"
  on public.visits for select
  using (auth.uid() = user_id);

create policy "Users can insert own visits"
  on public.visits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own visits"
  on public.visits for update
  using (auth.uid() = user_id);

create policy "Users can delete own visits"
  on public.visits for delete
  using (auth.uid() = user_id);

comment on table public.visits is '하루 관람 기록 — 전시 연결(nullable) + 메모';
