-- venue_group_name 보완 — '예술의전당 서예박물관'처럼 앞에 '예술의전당 '이 붙은 이름도 묶임
-- (20260805030000에서 exact match로 '서예박물관'만 썼으나 실제 DB 이름이 달라 미처 묶이지 않음)
UPDATE public.museums
SET venue_group_name = '예술의전당'
WHERE name ILIKE '%서예박물관%'
  AND venue_group_name IS NULL;

-- 혹시 한가람 계열도 마찬가지로 prefix가 붙어 있는 행이 있으면 함께 처리
UPDATE public.museums
SET venue_group_name = '예술의전당'
WHERE (name ILIKE '%한가람미술관%' OR name ILIKE '%한가람디자인%')
  AND venue_group_name IS NULL;
