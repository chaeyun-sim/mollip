-- date = 관람일. visit_key는 전시 식별만 둔다 (id:… / t:…).
-- 티켓은 사용자가 고른 관람일, 몰입은 가이드를 쓴 날이 date에 들어간다.
update public.visits
set visit_key = split_part(visit_key, '::', 2)
where visit_key like '%::%';

alter table public.visits
  drop constraint visits_pkey;

alter table public.visits
  add primary key (user_id, visit_key, date);

comment on column public.visits.date is
  '관람일 — 티켓은 사용자가 고른 날짜, 몰입은 가이드를 쓴 날';

comment on column public.visits.visit_key is
  '전시 식별자 — id:{exhibition_id} 또는 t:{title}. 관람일은 date 컬럼';
