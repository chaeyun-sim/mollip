-- 티켓 인증 사진: 로컬 파일 URI는 휘발성이라 Storage + visits 컬럼으로 보관한다
alter table public.visits
  add column if not exists ticket_photo_url text,
  add column if not exists venue_photo_urls text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do nothing;

create policy "Users can upload own visit photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own visit photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own visit photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Visit photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'visit-photos');
