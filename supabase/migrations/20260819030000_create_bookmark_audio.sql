-- bookmark_audio: 저장된 오디오 가이드 북마크
create table if not exists public.bookmark_audio (
  id             uuid not null default gen_random_uuid() primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  audio_guide_id uuid references public.audio_guides(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, audio_guide_id)
);

alter table public.bookmark_audio enable row level security;

create policy "Users can read own audio bookmarks"
  on public.bookmark_audio for select
  using (auth.uid() = user_id);

create policy "Users can insert own audio bookmarks"
  on public.bookmark_audio for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own audio bookmarks"
  on public.bookmark_audio for delete
  using (auth.uid() = user_id);

comment on table public.bookmark_audio is '오디오 가이드 북마크 — audio_guides의 즐겨찾기';
