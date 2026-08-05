-- exhibitions.museum_id — 한가람미술관 계열 venue_name_fallback 연결
-- museum name 기준 subquery로 ID 하드코딩 없이 매핑
update public.exhibitions
set museum_id = (select id from public.museums where name = '한가람미술관' limit 1)
where venue_name_fallback ilike '%한가람미술관%'
  and museum_id is null;

update public.exhibitions
set museum_id = (select id from public.museums where name = '한가람디자인미술관' limit 1)
where venue_name_fallback ilike '%한가람디자인미술관%'
  and museum_id is null;
