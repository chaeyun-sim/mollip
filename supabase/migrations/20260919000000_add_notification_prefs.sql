-- profiles.notification_prefs: 유저별 알림 카테고리 on/off. Edge Function이 발송 전 필터링에 사용한다.
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'weekly_recommendation', true,
    'visit_review', true,
    'bookmark_deadline', true,
    'venue_follow', true
  );

comment on column public.profiles.notification_prefs is '알림 카테고리별 수신 여부 — weekly_recommendation/visit_review/bookmark_deadline/venue_follow';
