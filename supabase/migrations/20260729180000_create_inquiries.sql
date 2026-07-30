-- 설정 > 문의하기 폼에서 들어오는 사용자 문의를 저장한다.
-- 클라이언트(anon)는 insert만 가능하고, 다른 사용자의 문의는 읽을 수 없다.
-- 운영자는 Supabase 대시보드(service role)에서 확인한다.

create table public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  contact      text,
  created_at   timestamptz not null default now()
);

alter table public.inquiries enable row level security;

create policy "inquiries_public_insert"
  on public.inquiries for insert to anon, authenticated with check (true);
