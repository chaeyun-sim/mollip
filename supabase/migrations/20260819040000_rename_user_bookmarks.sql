alter table public.user_bookmarks rename to bookmark_exhibitions;

comment on table public.bookmark_exhibitions is '사용자 전시 북마크 — toggle 시 upsert/delete, 로그인 시 hydration';
