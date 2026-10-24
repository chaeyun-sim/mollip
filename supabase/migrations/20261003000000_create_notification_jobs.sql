-- 예약 알림 큐. service_role Edge Function만 처리하며, dedupe_key로 재시도를 멱등화한다.
create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('notice', 'venue_follow', 'visit_review')),
  dedupe_key text not null unique,
  payload jsonb not null,
  send_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists notification_jobs_pending_idx
  on public.notification_jobs (send_at)
  where status = 'pending';

alter table public.notification_jobs enable row level security;

comment on table public.notification_jobs is
  '지연 푸시 큐 — notice/venue_follow/visit_review. service_role Edge Function만 처리';

-- notices webhook이 남아 있어도 즉시 발송하지 않고 2분 뒤 큐에 넣는다.
create or replace function public.enqueue_notice_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_jobs (kind, dedupe_key, payload, send_at)
  values (
    'notice',
    'notice:' || new.id::text,
    jsonb_build_object(
      'id', new.id,
      'title', new.title,
      'body', new.body,
      'category', new.category
    ),
    now() + interval '2 minutes'
  )
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;

drop trigger if exists notices_enqueue_notification on public.notices;
create trigger notices_enqueue_notification
after insert on public.notices
for each row execute function public.enqueue_notice_notification();

-- 신규 전시가 DB에 들어온 뒤 10분 후 팔로워 알림을 큐에 넣는다.
create or replace function public.enqueue_venue_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.museum_id is not null then
    insert into public.notification_jobs (kind, dedupe_key, payload, send_at)
    values (
      'venue_follow',
      'venue_follow:exhibition:' || new.id::text,
      jsonb_build_object('exhibitionId', new.id),
      now() + interval '10 minutes'
    )
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists exhibitions_enqueue_venue_notification on public.exhibitions;
create trigger exhibitions_enqueue_venue_notification
after insert on public.exhibitions
for each row execute function public.enqueue_venue_follow_notification();

-- 관람 종료 시각은 앱이 종료 순간 저장한다.
alter table public.visits
  add column if not exists visit_started_at timestamptz,
  add column if not exists visit_ended_at timestamptz,
  add column if not exists visit_status text not null default 'recorded'
    check (visit_status in ('recorded', 'ended', 'confirmed'));

create or replace function public.enqueue_visit_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visit_ended_at is not null
     and (tg_op = 'INSERT' or old.visit_ended_at is null or old.visit_ended_at is distinct from new.visit_ended_at) then
    insert into public.notification_jobs (kind, dedupe_key, payload, send_at)
    values (
      'visit_review',
      'visit_review:' || new.user_id::text || ':' || new.visit_key || ':' || new.date::text,
      jsonb_build_object(
        'userId', new.user_id,
        'date', new.date,
        'visitKey', new.visit_key,
        'exhibitionTitle', new.exhibition_title
      ),
      new.visit_ended_at
    )
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists visits_enqueue_review_notification on public.visits;
create trigger visits_enqueue_review_notification
after insert or update of visit_ended_at on public.visits
for each row execute function public.enqueue_visit_review_notification();
