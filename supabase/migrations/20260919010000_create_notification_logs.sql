-- notification_logs: 발송된 푸시 알림 로그 — 알림함(app/notifications) 화면의 서버 정본
create table if not exists public.notification_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null default '',
  body       text not null,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_user_id_created_at_idx
  on public.notification_logs (user_id, created_at desc);

alter table public.notification_logs enable row level security;

create policy "Users can read own notification logs"
  on public.notification_logs for select
  using (auth.uid() = user_id);

create policy "Users can mark own notification logs read"
  on public.notification_logs for update
  using (auth.uid() = user_id);

comment on table public.notification_logs is '발송된 푸시 알림 로그 — 알림함 화면의 서버 정본. insert는 service_role(Edge Function)만 수행.';
