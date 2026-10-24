-- 공지 푸시 지연을 2분에서 1분으로 단축한다. (매분 cron 때문에 실제 도착은 1~2분 사이)
create or replace function public.enqueue_notice_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_jobs (kind, dedupe_key, payload, send_at)
  values (
    'notice',
    'notice:' || new.id::text,
    jsonb_build_object(
      'id', new.id,
      'title', new.title,
      'body', new.body,
      'category', new.category
    ),
    now() + interval '1 minute'
  )
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;
