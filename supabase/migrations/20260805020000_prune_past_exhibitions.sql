-- end_date < 2026.08.01 인 과거 전시 삭제
delete from public.exhibitions
where end_date < '2026.08.01';
