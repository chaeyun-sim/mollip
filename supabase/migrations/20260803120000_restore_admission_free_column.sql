-- exhibitions.admission_free 가 migration 이력(20260731000000_unify_exhibitions.sql)에는 정의돼
-- 있지만 원격 스키마에는 존재하지 않던 drift를 복구한다 (원인 불명 — 대시보드에서 직접 드롭된 것으로 추정).
alter table public.exhibitions
  add column if not exists admission_free boolean not null default false;

update public.exhibitions
set admission_free = true
where admission_free = false
  and (admission = '무료' or admission ilike '%무료%');
