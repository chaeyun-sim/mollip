-- Daily exhibition data refresh at 03:20 KST (18:20 UTC).
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.sync_exhibitions_batch(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  affected integer;
begin
  insert into public.exhibitions (
    source, title, start_date, end_date, venue_name_fallback,
    description, admission, open_hours, ticket_url, genre, image_url, synced_at
  )
  select
    row_data->>'source',
    row_data->>'title',
    row_data->>'start_date',
    row_data->>'end_date',
    coalesce(row_data->>'venue_name_fallback', '장소 정보 없음'),
    coalesce(row_data->>'description', ''),
    row_data->>'admission',
    coalesce(row_data->>'open_hours', '운영시간 정보 없음'),
    row_data->>'ticket_url',
    row_data->>'genre',
    row_data->>'image_url',
    coalesce((row_data->>'synced_at')::timestamptz, now())
  from jsonb_array_elements(p_rows) as elements(row_data)
  on conflict (title, start_date, end_date) do update set
    source = excluded.source,
    venue_name_fallback = excluded.venue_name_fallback,
    description = coalesce(nullif(excluded.description, ''), public.exhibitions.description),
    admission = coalesce(nullif(excluded.admission, ''), public.exhibitions.admission),
    open_hours = case
      when excluded.open_hours = '운영시간 정보 없음' then public.exhibitions.open_hours
      else excluded.open_hours
    end,
    ticket_url = coalesce(excluded.ticket_url, public.exhibitions.ticket_url),
    genre = coalesce(excluded.genre, public.exhibitions.genre),
    image_url = coalesce(excluded.image_url, public.exhibitions.image_url),
    synced_at = excluded.synced_at
  where public.exhibitions.source = excluded.source;

  get diagnostics affected = row_count;
  return affected;
end;
$function$;

revoke all on function public.sync_exhibitions_batch(jsonb) from public, anon, authenticated;
grant execute on function public.sync_exhibitions_batch(jsonb) to service_role;

select cron.unschedule(jobid)
from cron.job
where jobname = 'daily-exhibition-sync';

select cron.schedule(
  'daily-exhibition-sync',
  '20 18 * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url')
        || '/functions/v1/sync-exhibitions',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $job$
);
