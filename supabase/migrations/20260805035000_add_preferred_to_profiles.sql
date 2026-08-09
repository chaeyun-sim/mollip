-- SPEC-UI-002: 온보딩 취향 기반 추천 전시 개인화
-- profiles 테이블에 사용자 선호 장르/작가 컬럼 추가

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_genres  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_artists text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.preferred_genres  IS '온보딩에서 수집한 선호 장르 (mainGenre + subGenre)';
COMMENT ON COLUMN public.profiles.preferred_artists IS '온보딩에서 수집한 선호 작가';
