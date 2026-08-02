-- 전시 유형(상설전/기획전/특별전 등) — tags와 분리된 단일 값
ALTER TABLE public.exhibitions
  ADD COLUMN IF NOT EXISTS type text;

COMMENT ON COLUMN public.exhibitions.type IS '전시 유형 단일값 (상설전, 기획전, 특별전, …)';

-- backfill은 scripts/classify_exhibition_genre_tags.py --apply 로 수행 (tags가 text/json 혼재 가능)
