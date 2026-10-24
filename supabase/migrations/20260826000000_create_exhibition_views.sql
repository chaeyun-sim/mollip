-- exhibition_views: 사용자별 전시 상세 조회 기록 (사용자당 하루 1회)
-- 인기 랭킹(북마크 수 + 조회수) 산정의 기초 데이터.
create table if not exists public.exhibition_views (
  user_id       uuid not null references auth.users(id) on delete cascade,
  exhibition_id text not null,
  viewed_date   date not null default (timezone('Asia/Seoul', now()))::date,
  created_at    timestamptz not null default now(),
  primary key (user_id, exhibition_id, viewed_date)
);

comment on table public.exhibition_views is
  '전시 상세 조회 기록 — (user_id, exhibition_id, viewed_date) PK로 사용자당 하루 1회만 기록된다';

-- 집계 함수가 exhibition_id로 group by 하므로 보조 인덱스를 둔다.
create index if not exists exhibition_views_exhibition_id_idx
  on public.exhibition_views (exhibition_id);

alter table public.exhibition_views enable row level security;

create policy "Users can read own exhibition views"
  on public.exhibition_views for select
  using (auth.uid() = user_id);

create policy "Users can insert own exhibition views"
  on public.exhibition_views for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 인기 전시 집계 (security definer)
-- bookmark_exhibitions / exhibition_views 모두 RLS로 "본인 행"만 노출되므로
-- 전체 사용자 기준 집계는 security definer 함수로만 가능하다.
-- 가중치는 아래 weights CTE 한 곳에서만 정의한다 (튜닝 시 이 두 줄만 수정).
-- ---------------------------------------------------------------------------
create or replace function public.get_popular_exhibitions(p_limit integer default 20)
returns table (
  exhibition_id  text,
  bookmark_count bigint,
  view_count     bigint,
  score          numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with weights as (
    select 1.0::numeric as bookmark_weight,
           1.0::numeric as view_weight
  ),
  raw_counts as (
    select b.exhibition_id as ex_id, 1::bigint as bookmarks, 0::bigint as views
    from public.bookmark_exhibitions b
    union all
    select v.exhibition_id as ex_id, 0::bigint as bookmarks, 1::bigint as views
    from public.exhibition_views v
  ),
  merged as (
    select r.ex_id,
           sum(r.bookmarks) as bookmarks,
           sum(r.views)     as views
    from raw_counts r
    group by r.ex_id
  )
  select m.ex_id                                                      as exhibition_id,
         m.bookmarks                                                  as bookmark_count,
         m.views                                                      as view_count,
         (m.bookmarks * w.bookmark_weight + m.views * w.view_weight)  as score
  from merged m
  cross join weights w
  order by score desc, m.ex_id asc
  limit greatest(coalesce(p_limit, 20), 0);
$$;

comment on function public.get_popular_exhibitions(integer) is
  '전체 사용자 기준 인기 전시 집계 — 북마크 수 × 1.0 + 조회수 × 1.0, 점수 내림차순 · exhibition_id 오름차순';

-- 비로그인(anon) 사용자도 인기 목록은 조회할 수 있어야 한다(기록만 하지 않는다).
revoke all on function public.get_popular_exhibitions(integer) from public;
grant execute on function public.get_popular_exhibitions(integer) to anon, authenticated;
