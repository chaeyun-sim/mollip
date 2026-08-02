-- http / https / www. 로 시작하지 않는 URL은 null 처리 (앱·외부 브라우저 오류 방지)
-- exhibitions · museums 의 링크/이미지 URL 컬럼 대상

CREATE OR REPLACE FUNCTION public.is_allowed_web_url(raw text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    raw IS NOT NULL
    AND btrim(raw) <> ''
    AND (
      lower(btrim(raw)) LIKE 'http://%'
      OR lower(btrim(raw)) LIKE 'https://%'
      OR lower(btrim(raw)) LIKE 'www.%'
    );
$$;

COMMENT ON FUNCTION public.is_allowed_web_url(text) IS
  'http://, https://, www. 접두사가 있는 URL만 true';

-- exhibitions
UPDATE public.exhibitions
SET ticket_url = NULL
WHERE ticket_url IS NOT NULL AND NOT public.is_allowed_web_url(ticket_url);

UPDATE public.exhibitions
SET web_site = NULL
WHERE web_site IS NOT NULL AND NOT public.is_allowed_web_url(web_site);

UPDATE public.exhibitions
SET image_url = NULL
WHERE image_url IS NOT NULL AND NOT public.is_allowed_web_url(image_url);

-- museums
UPDATE public.museums
SET homepage_url = NULL
WHERE homepage_url IS NOT NULL AND NOT public.is_allowed_web_url(homepage_url);

-- manual_exhibitions (레거시 테이블이 남아 있는 경우)
DO $$
BEGIN
  IF to_regclass('public.manual_exhibitions') IS NOT NULL THEN
    UPDATE public.manual_exhibitions
    SET url = NULL
    WHERE url IS NOT NULL AND NOT public.is_allowed_web_url(url);

    UPDATE public.manual_exhibitions
    SET image_url = NULL
    WHERE image_url IS NOT NULL AND NOT public.is_allowed_web_url(image_url);
  END IF;
END $$;

-- 필요 없으면 함수만 DROP: DROP FUNCTION public.is_allowed_web_url(text);
