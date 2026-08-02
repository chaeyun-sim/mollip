-- venue_name_fallback='국립현대미술관'인 행은 event_site로 분관을 구분할 수 있다
-- (과천/덕수궁/서울). 그 외 값(레지던시/해외/기타/청주 등)은 museums에 해당 분관이
-- 없거나 특정 분관을 가리키지 않아 museum_id를 비워둔다.
update public.exhibitions set museum_id = 53
where venue_name_fallback = '국립현대미술관' and event_site = '과천' and museum_id is null;

update public.exhibitions set museum_id = 40
where venue_name_fallback = '국립현대미술관' and event_site = '덕수궁' and museum_id is null;

update public.exhibitions set museum_id = 63
where venue_name_fallback = '국립현대미술관' and event_site = '서울' and museum_id is null;
