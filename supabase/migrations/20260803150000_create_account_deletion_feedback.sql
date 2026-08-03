-- 탈퇴 사유 수집. 계정이 실제로 삭제되기 전에 익명으로 남기는 피드백이라 user_id를 두지 않는다.
create table public.account_deletion_feedback (
  id         uuid primary key default gen_random_uuid(),
  reason     text not null check (
    reason in ('low_usage', 'too_many_notifications', 'bad_recommendations', 'privacy_concern', 'other')
  ),
  detail     text,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;

create policy "account_deletion_feedback_insert"
  on public.account_deletion_feedback for insert to anon, authenticated with check (true);
