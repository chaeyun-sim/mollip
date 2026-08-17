-- 추천 알림 Edge Function 주 1회 크론 (매주 월요일 10:00 KST = 01:00 UTC)
-- pg_cron 확장이 활성화되어 있어야 합니다 (Supabase 대시보드 Extensions에서 활성화)
select
  cron.schedule(
    'weekly-recommendation-push',
    '0 1 * * 1',
    $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-recommendations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
    $$
  );
