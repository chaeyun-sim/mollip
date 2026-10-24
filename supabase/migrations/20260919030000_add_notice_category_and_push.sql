-- notices.category: 공지 종류 — 신규 등록 시 어떤 알림 선호를 확인할지 결정
alter table public.notices
  add column if not exists category text not null default 'general'
    check (category in ('version_update', 'terms_update', 'general'));

-- 기존 유저 notification_prefs에 새 카테고리 2개 추가 (기본값 true)
update public.profiles
  set notification_prefs = notification_prefs
    || jsonb_build_object('version_update', true, 'terms_update', true)
  where not (notification_prefs ? 'version_update');

alter table public.profiles
  alter column notification_prefs
    set default jsonb_build_object(
      'weekly_recommendation', true,
      'visit_review', true,
      'bookmark_deadline', true,
      'venue_follow', true,
      'version_update', true,
      'terms_update', true
    );
