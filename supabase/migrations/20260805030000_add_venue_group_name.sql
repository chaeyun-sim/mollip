-- museums.venue_group_name — 같은 건물/캠퍼스 안의 미술관을 지도에서 하나의 핀으로 묶기 위한 컬럼
-- 이 컬럼이 있는 행은 useMuseums에서 venue_group_name을 부모 이름으로 갖는 단일 VenueGroup으로 합쳐진다.
ALTER TABLE public.museums
  ADD COLUMN IF NOT EXISTS venue_group_name TEXT;

-- 예술의전당 — 한가람미술관·한가람디자인미술관·서예박물관이 같은 주소에 있어 핀이 겹침
UPDATE public.museums
SET venue_group_name = '예술의전당'
WHERE name IN ('한가람미술관', '한가람디자인미술관', '서예박물관');
