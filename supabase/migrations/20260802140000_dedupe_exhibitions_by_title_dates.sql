-- 제목 + 시작일 + 종료일이 같으면 중복 (source 무관). kcisa > manual > culture 우선 유지.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY title, start_date, end_date
      ORDER BY
        CASE source
          WHEN 'kcisa' THEN 1
          WHEN 'manual' THEN 2
          WHEN 'culture' THEN 3
          ELSE 4
        END,
        id
    ) AS rn
  FROM public.exhibitions
)
DELETE FROM public.exhibitions e
USING ranked r
WHERE e.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS exhibitions_title_start_end_key
  ON public.exhibitions (title, start_date, end_date);

COMMENT ON INDEX public.exhibitions_title_start_end_key IS
  '동일 전시명·기간 중복 insert 방지';
