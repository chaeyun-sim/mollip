-- 예술의전당 전시정보 API(API_CCA_149) 라이브 동기화를 위한 새 source 추가.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.exhibitions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%source%';

  execute format('alter table public.exhibitions drop constraint %I', constraint_name);
  execute 'alter table public.exhibitions add constraint exhibitions_source_check '
    || 'check (source in (''kcisa'', ''kcisa_moca'', ''sac'', ''culture'', ''manual''))';
end $$;
