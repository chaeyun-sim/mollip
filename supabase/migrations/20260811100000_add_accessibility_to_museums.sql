-- museums 테이블에 접근성 정보 컬럼 추가
-- 한국관광공사 detailWithTour2 API 데이터를 JSONB로 저장
alter table museums
  add column if not exists accessibility jsonb default null;

comment on column museums.accessibility is
  '한국관광공사 detailWithTour2 API에서 가져온 접근성 정보 (주차, 장애인 편의시설, 유아차 등)';
