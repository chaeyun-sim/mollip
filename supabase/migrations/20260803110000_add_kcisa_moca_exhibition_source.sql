-- moca/docMeta API(국립현대미술관 전시정보, 실제 발급 키로 라이브 동기화)를 위한 새 source 추가.
-- 기존 source='kcisa'는 과거 스냅샷(설명/이미지 포함, 재동기화 불가)이라 그대로 보존하고,
-- 신규 라이브 동기화는 별도 source로 분리해 덮어쓰지 않게 한다.
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
    || 'check (source in (''kcisa'', ''kcisa_moca'', ''culture'', ''manual''))';
end $$;
