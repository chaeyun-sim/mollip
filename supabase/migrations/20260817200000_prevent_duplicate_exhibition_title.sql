-- title이 이미 존재하는 경우 INSERT/UPDATE를 무시한다.
-- 대시보드 직접 입력 및 스크립트 모두 적용됨.

create or replace function prevent_duplicate_exhibition_title()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from exhibitions
    where title = new.title
      and id is distinct from new.id
  ) then
    return null;  -- 조용히 무시
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_title on exhibitions;

create trigger trg_prevent_duplicate_title
  before insert or update on exhibitions
  for each row execute function prevent_duplicate_exhibition_title();
