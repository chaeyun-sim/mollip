-- 관람 종료(visit_ended_at 기록) 즉시 리뷰 알림을 보내도록 변경.
-- 기존: notification_jobs에 send_at=종료시각으로 넣고 1분 주기 cron이 처리 → 최대 1분+ 지연.
-- 변경: 작업을 넣은 직후 pg_net으로 process-notification-jobs를 바로 호출한다.
--       pg_net 요청은 트랜잭션 커밋 후 전송되므로 함수는 방금 넣은 작업을 볼 수 있다.
--       호출이 실패해도 작업은 pending으로 남아 기존 cron이 재처리한다 (멱등: dedupe_key + 상태 claim).
create or replace function public.enqueue_visit_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if new.visit_ended_at is not null
     and (tg_op = 'INSERT' or old.visit_ended_at is null or old.visit_ended_at is distinct from new.visit_ended_at) then
    insert into public.notification_jobs (kind, dedupe_key, payload, send_at)
    values (
      'visit_review',
      'visit_review:' || new.user_id::text || ':' || new.visit_key || ':' || new.date::text,
      jsonb_build_object(
        'userId', new.user_id,
        'date', new.date,
        'visitKey', new.visit_key,
        'exhibitionTitle', new.exhibition_title
      ),
      -- 클라이언트 시계가 서버보다 빠르면 즉시 호출 시점에 아직 due가 아니어서 cron까지 밀린다
      least(new.visit_ended_at, now())
    )
    on conflict (dedupe_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      begin
        perform net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url')
            || '/functions/v1/process-notification-jobs',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
        );
      exception when others then
        -- 즉시 호출 실패가 visits 저장을 막지 않도록 — cron이 이어서 처리한다
        raise warning 'visit_review immediate dispatch failed: %', sqlerrm;
      end;
    end if;
  end if;
  return new;
end;
$$;
