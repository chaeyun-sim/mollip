-- visits: 관람 기록 시점의 전시 제목·장소를 스냅샷으로 저장
-- exhibitions 테이블(특히 source='culture')은 주기적으로 delete+재삽입되어 id가 바뀔 수 있어,
-- 다이어리 기록은 exhibition_id 조회에만 의존하면 안 됨
alter table public.visits
  add column if not exists exhibition_title text,
  add column if not exists venue text;
