-- 대시보드에서 직접 전시를 추가할 때 source를 매번 안 적어도 되도록 기본값을 'manual'로 설정.
-- kcisa/culture는 코드에서 upsert할 때 명시적으로 값을 넣으므로 기본값 영향 없음.
alter table public.exhibitions alter column source set default 'manual';
