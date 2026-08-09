-- end_date < 2026.08.01 인 전시는 절대 삽입/업데이트 불가 — DB 레벨 강제.
-- 스크립트(exhibition_sync_filters.py)의 end_date_eligible()와 동일 기준.

-- 남아있는 과거 전시 정리 (null·형식 불일치 포함)
delete from public.exhibitions
where end_date < '2026.08.01'
   or end_date is null
   or end_date !~ '^\d{4}\.\d{2}\.\d{2}$';

-- 이후 어떤 스크립트도 과거 데이터를 넣지 못하도록 CHECK 제약 추가
alter table public.exhibitions
  add constraint exhibitions_end_date_min
  check (end_date >= '2026.08.01');
