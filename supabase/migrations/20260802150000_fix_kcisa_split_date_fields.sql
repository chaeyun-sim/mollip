-- KCISA 적재 시 기간이 start_date 한 칸에 "YYYY.MM.DD YYYY.MM.DD" 로 들어간 행 보정
-- end_date 가 비어 있고 start_date 에 공백으로 구분된 날짜 두 개가 있을 때만 분리

update public.exhibitions e
set
  start_date = split_part(trim(e.start_date), ' ', 1),
  end_date = coalesce(
    nullif(trim(split_part(trim(e.start_date), ' ', 2)), ''),
    e.end_date
  )
where e.source = 'kcisa'
  and (e.end_date is null or trim(e.end_date) = '')
  and trim(e.start_date) ~ '^\d{4}\.\d{2}\.\d{2}\s+\d{4}\.\d{2}\.\d{2}';

-- "YYYY.MM.DD 00:00:00" 타임스탬프 접미사 제거
update public.exhibitions
set
  start_date = regexp_replace(trim(start_date), '\s+\d{2}:\d{2}:\d{2}\s*$', ''),
  end_date = regexp_replace(trim(end_date), '\s+\d{2}:\d{2}:\d{2}\s*$', '')
where source = 'kcisa'
  and (
    trim(start_date) ~ '\d{2}:\d{2}:\d{2}'
    or trim(end_date) ~ '\d{2}:\d{2}:\d{2}'
  );
