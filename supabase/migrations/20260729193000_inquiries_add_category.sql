-- 문의 유형(버그 제보/기능 제안/기타) 분류 컬럼 추가.
alter table public.inquiries
  add column category text not null default 'other'
  check (category in ('bug', 'feature', 'other'));
