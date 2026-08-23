-- audio_guides: 사용자가 저장한 오디오 가이드 해설
create table if not exists public.audio_guides (
  id         uuid not null default gen_random_uuid() primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  artist     text,
  image_url  text,
  full_text  text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audio_guides enable row level security;

create policy "Users can read own audio guides"
  on public.audio_guides for select
  using (auth.uid() = user_id);

create policy "Users can insert own audio guides"
  on public.audio_guides for insert
  with check (auth.uid() = user_id);

create policy "Users can update own audio guides"
  on public.audio_guides for update
  using (auth.uid() = user_id);

create policy "Users can delete own audio guides"
  on public.audio_guides for delete
  using (auth.uid() = user_id);

comment on table public.audio_guides is '저장된 오디오 가이드 해설 — 하트 버튼으로 저장, historyStore 동기화';
