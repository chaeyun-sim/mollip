-- visits: 하루 1행(user_id, date)이면 같은 날 티켓 인증과 몰입 관람이 덮인다.
-- 로컬 makeVisitKey("날짜::전시")와 맞춰 전시별로 따로 저장한다.
alter table public.visits
  add column if not exists visit_key text;

update public.visits
set visit_key = date::text || '::' ||
  case
    when exhibition_id is not null then 'id:' || exhibition_id::text
    when coalesce(exhibition_title, '') <> '' then 't:' || exhibition_title
    else 'manual'
  end
where visit_key is null;

alter table public.visits
  alter column visit_key set not null;

alter table public.visits
  drop constraint visits_pkey;

alter table public.visits
  add primary key (user_id, visit_key);

create index if not exists visits_user_date_idx
  on public.visits (user_id, date);

comment on column public.visits.visit_key is
  'App visit key — {date}::id:{exhibition_id} or {date}::t:{title}';

comment on table public.visits is
  '관람 기록 — 사용자·방문 키(날짜+전시)당 1행. 같은 날 여러 전시/티켓을 허용';
