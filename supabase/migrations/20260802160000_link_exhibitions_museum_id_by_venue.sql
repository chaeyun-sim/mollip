-- exhibitions.museum_id ← museums.name / venue_name_fallback 매칭 (재실행 가능, museum_id IS NULL 만).
-- 1) MMCA 분관(event_site)  2) venue 별칭  3) exact  4) 접두·접미(단어 경계) — 후보 1개일 때만.

-- ── 진단 (실행 전후 확인용, 주석 해제) ──
-- select source, venue_name_fallback, event_site, count(*)
-- from public.exhibitions where museum_id is null
-- group by 1, 2, 3 order by count(*) desc;

-- ── 1. 국립현대미술관: venue + event_site ──
update public.exhibitions e
set museum_id = m.id
from public.museums m
where e.museum_id is null
  and e.venue_name_fallback = '국립현대미술관'
  and e.event_site = '과천'
  and m.name = '국립현대미술관(과천관)';

update public.exhibitions e
set museum_id = m.id
from public.museums m
where e.museum_id is null
  and e.venue_name_fallback = '국립현대미술관'
  and e.event_site = '덕수궁'
  and m.name = '국립현대미술관(덕수궁관)';

update public.exhibitions e
set museum_id = m.id
from public.museums m
where e.museum_id is null
  and e.venue_name_fallback = '국립현대미술관'
  and e.event_site = '서울'
  and m.name = '국립현대미술관(서울관)';

-- ── 2. venue 별칭 (문화포털·KCISA 표기 ≠ museums.name) ──
update public.exhibitions e
set museum_id = m.id
from public.museums m
where e.museum_id is null
  and (
    (e.venue_name_fallback = '이우환 공간' and m.name = '부산시립미술관')
    or (e.venue_name_fallback = '국립현대미술관 과천관' and m.name = '국립현대미술관(과천관)')
    or (e.venue_name_fallback = 'DDP 동대문디자인플라자' and m.name ilike '%동대문디자인플라자%')
    or (e.venue_name_fallback = 'KT&G 상상마당' and m.name = 'KT&G 상상마당 홍대')
  );

-- ── 3. museums.name 과 완전 일치 (대소문자·공백 무시) ──
update public.exhibitions e
set museum_id = m.id
from public.museums m
where e.museum_id is null
  and lower(trim(e.venue_name_fallback)) = lower(trim(m.name));

-- ── 4. 단어 경계 접두/접미 — exhibition 당 museum 후보가 정확히 1개일 때만 ──
--    예: venue "종로구립 고희동미술관" ↔ museum "고희동미술관"
--        venue "국립현대미술관 서울관" ↔ museum "국립현대미술관(서울관)" 은 별칭表기라 3번/2번 우선
with venue_museum_match as (
  select
    e.id as exhibition_id,
    m.id as museum_id
  from public.exhibitions e
  inner join public.museums m on (
    trim(e.venue_name_fallback) ilike trim(m.name) || ' %'
    or trim(e.venue_name_fallback) ilike '% ' || trim(m.name)
  )
  where e.museum_id is null
    and trim(e.venue_name_fallback) <> ''
    and trim(m.name) <> ''
),
single_match as (
  select exhibition_id, min(museum_id) as museum_id
  from venue_museum_match
  group by exhibition_id
  having count(*) = 1
)
update public.exhibitions e
set museum_id = s.museum_id
from single_match s
where e.id = s.exhibition_id
  and e.museum_id is null;

-- ── 5. (선택) 접두 일치인데 후보 여러 개 → 가장 긴 museum.name 하나만 유일할 때 ──
with venue_museum_match as (
  select
    e.id as exhibition_id,
    m.id as museum_id,
    length(trim(m.name)) as name_len
  from public.exhibitions e
  inner join public.museums m on trim(e.venue_name_fallback) ilike trim(m.name) || ' %'
  where e.museum_id is null
    and trim(m.name) <> ''
),
longest as (
  select distinct on (exhibition_id)
    exhibition_id,
    museum_id,
    name_len
  from venue_museum_match
  order by exhibition_id, name_len desc
),
unambiguous_longest as (
  select l.exhibition_id, l.museum_id
  from longest l
  where not exists (
    select 1
    from venue_museum_match v
    where v.exhibition_id = l.exhibition_id
      and v.name_len = l.name_len
      and v.museum_id <> l.museum_id
  )
)
update public.exhibitions e
set museum_id = u.museum_id
from unambiguous_longest u
where e.id = u.exhibition_id
  and e.museum_id is null;
