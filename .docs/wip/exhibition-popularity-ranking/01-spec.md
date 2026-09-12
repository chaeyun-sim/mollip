---
feature-slug: exhibition-popularity-ranking
tier: L
author: john
status: draft
---

# Spec — 전시 인기 랭킹

## Problem

- 홈 화면의 전시 섹션은 현재 `FeaturedCarousel`(외부 API 순서 그대로), `KcisaSection`(국공립 기관), `추천 전시`(개인 취향 기반) 세 가지뿐이다. 셋 다 "다른 사용자들이 실제로 많이 보고 저장한 전시가 무엇인가"를 알려주지 못한다.
- 취향 데이터가 없는 신규 사용자에게는 `추천 전시` 섹션이 개인화되지 않은 목록(`displayedRecommended` 폴백)으로 노출되어, 사실상 "아무거나 앞에서 5개"가 보인다. 사회적 증거(social proof)에 해당하는 진입점이 없다.
- 외부 인기도 데이터 소스(서울시 실시간 상권데이터, 문체부 관람인원 통계, Instagram 해시태그 API)는 Manager 검토 단계에서 전부 기각됐다. 따라서 앱이 이미 보유한 자체 행동 데이터(북마크·전시 상세 조회)로 인기도를 산정해야 한다.
- 북마크 데이터는 이미 `public.bookmark_exhibitions`에 쌓이고 있으나 **조회 행동은 어디에도 기록되지 않는다** — 인기도를 산정하려면 조회수 수집 파이프라인부터 새로 만들어야 한다.

## Goals

- 로그인 사용자의 전시 상세 조회를 **사용자당 하루 1회** 기준으로 기록하는 데이터 파이프라인을 만든다.
- 북마크 수와 조회수를 합산한 "인기 점수"로 전시를 정렬해 상위 N개를 산출한다.
- 홈 화면에 기존 가로 스크롤 카드 섹션과 동일한 톤의 "인기 전시" 섹션을 추가한다.
- 비로그인 사용자도 인기 전시 목록은 **볼 수 있게** 한다(기록만 하지 않는다).
- 가중치는 코드 상수 한 곳에서만 정의해 추후 튜닝이 코드 1줄 변경으로 끝나게 한다.

## Non-goals (out of scope)

- **가중치 튜닝 UI / 원격 config** — 북마크·조회수 가중치를 관리 화면이나 원격 설정으로 조절하는 기능은 만들지 않는다. 이번에는 클라이언트/DB 함수 내 상수(각 1.0)로 고정한다.
- **실시간 집계 / 실시간 구독** — Supabase Realtime 구독이나 조회 즉시 랭킹 갱신은 하지 않는다. 화면 진입 시 1회 조회(fetch)만 한다.
- **관리자 대시보드 / 통계 화면** — 조회수·인기 점수를 열람하는 운영자용 화면은 만들지 않는다.
- **개별 전시 상세 화면에 조회수·인기 순위 표시** — 이번 스코프는 홈 섹션까지다. 상세 화면 UI는 변경하지 않는다(조회 기록 호출만 추가).
- **비로그인 사용자 조회수 집계** — 익명 디바이스 ID 기반 카운트는 스팸 방지 정책상 하지 않는다.
- **기간 가중(최근 7일 인기 등) · 시간 감쇠(decay) 알고리즘** — 이번에는 전체 기간 누적 단순 합산이다.
- **기존 섹션 제거·재배치** — `FeaturedCarousel`, `KcisaSection`, `추천 전시`는 그대로 둔다. 인기 전시 섹션만 추가한다.
- **조회 기록 오프라인 큐잉·재시도** — 네트워크 실패 시 조용히 버린다(사용자에게 영향 없음).
- **전시 목록/검색 화면의 인기순 정렬 옵션** — 홈 섹션 외 화면에는 적용하지 않는다.

## Users & context

- **주 사용자**: 홈 화면에서 "지금 볼 만한 전시"를 탐색하는 로그인 사용자(ARCHITECTURE.md §3 User Journey 1단계 "발견").
- **부 사용자**: 아직 로그인하지 않은 신규 사용자 — 인기 전시를 보고 앱의 가치를 판단한다. 이 앱은 몰입모드·해설 생성 등 핵심 기능이 이미 로그인 게이팅(`useRequireAuth`, `Fab needsLogin`)되어 있어 로그인 사용자 비중이 높다.
- **데이터 맥락**: `bookmark_exhibitions`는 RLS로 `auth.uid() = user_id` 행만 SELECT 가능하다. 따라서 **전체 사용자 집계는 클라이언트 쿼리로 불가능**하며, `security definer` DB 함수(RPC) 또는 집계 뷰가 반드시 필요하다 — Risks 참고.
- **전시 ID 맥락**: `exhibition_id`는 외부 API(KCISA/Culture) 기준 문자열 ID이며 앱 DB에 전시 마스터 테이블이 없다. 집계 결과는 ID 목록 + 점수일 뿐이고, 제목·썸네일 등 표시 정보는 기존 전시 데이터 훅에서 조인해야 한다.

## Acceptance criteria

### AC-1: 조회 기록 테이블 마이그레이션

- **Given** `supabase/migrations/`에 조회 기록 테이블이 존재하지 않는 상태에서
- **When** 신규 마이그레이션 파일로 `public.exhibition_views(user_id uuid, exhibition_id text, viewed_date date, created_at timestamptz)` 테이블을 생성하고 `(user_id, exhibition_id, viewed_date)`를 primary key(또는 unique 제약)로 지정한 뒤 RLS를 활성화하고 "본인 행 select/insert" 정책을 추가하면
- **Then** 동일한 `(user_id, exhibition_id, viewed_date)` 조합을 두 번 insert했을 때 두 번째 insert가 unique 위반으로 거부되고(또는 `on conflict do nothing`으로 무시되고) 테이블에는 1행만 남는다. `src/types/database.types.ts`에 `exhibition_views` 타입이 반영되어 `npx tsc --noEmit`이 0 에러로 통과한다.

### AC-2: 로그인 사용자의 전시 상세 조회 기록

- **Given** 로그인한 사용자가 오늘 전시 `E`의 상세 화면을 아직 열지 않은 상태에서
- **When** 홈 또는 검색에서 전시 카드를 탭해 `app/(explore)/[id].tsx`에 진입하고 전시 데이터 로딩이 완료되면
- **Then** `exhibition_views`에 `(해당 user_id, E의 id, 오늘 날짜)` 행이 1건 생성된다. 화면에는 어떤 로딩 인디케이터나 토스트도 추가로 나타나지 않으며, 기록 요청이 실패하더라도 상세 화면은 정상 렌더링된다.

### AC-3: 동일 사용자·동일 전시·동일 날짜 중복 제거

- **Given** 로그인한 사용자가 오늘 이미 전시 `E`의 상세 화면을 1회 열어 `exhibition_views`에 행이 1건 있는 상태에서
- **When** 같은 날 같은 전시 상세 화면을 3회 더 열면
- **Then** `exhibition_views`의 해당 사용자·전시 행 수는 여전히 1건이며, 화면에는 오류 메시지가 표시되지 않는다(중복 insert는 조용히 무시된다).

### AC-4: 비로그인 사용자는 조회를 기록하지 않는다

- **Given** 로그인하지 않은(세션 없는) 사용자가
- **When** 전시 상세 화면(`app/(explore)/[id].tsx`)에 진입하면
- **Then** `exhibition_views`에 어떤 행도 생성되지 않고, Supabase 요청도 발생하지 않으며(네트워크 호출 자체를 건너뛴다), 로그인 화면으로 리디렉션되지 않고 상세 화면이 정상 렌더링된다. 콘솔에 인증 관련 에러가 출력되지 않는다.

### AC-5: 인기 점수 집계 결과 반환

- **Given** `bookmark_exhibitions`와 `exhibition_views`에 여러 사용자의 데이터가 쌓여 있고, RLS 때문에 클라이언트가 타인의 행을 직접 SELECT할 수 없는 상태에서
- **When** 클라이언트가 인기 랭킹 집계(전체 사용자 기준 `북마크 수 × 1.0 + 조회수 × 1.0`)를 요청하면
- **Then** `exhibition_id`와 인기 점수가 점수 내림차순으로 정렬된 목록이 최대 20건 반환된다. 점수가 동일한 경우 정렬 순서가 매 호출마다 동일하도록 2차 정렬 기준(예: `exhibition_id`)이 적용되어 있다. 가중치 값은 코드/함수 내 명명된 상수 한 곳에서만 정의되어 있어 값 변경이 1줄 수정으로 끝난다.

### AC-6: 홈 화면 "인기 전시" 섹션 노출

- **Given** 인기 점수 집계 결과가 1건 이상 있고, 해당 전시들의 표시 정보(제목·장소·썸네일)를 기존 전시 데이터 소스에서 확보할 수 있는 상태에서
- **When** 사용자가 홈 화면(`app/(tabs)/index.tsx`)을 열고 스크롤하면
- **Then** `KcisaSection`과 동일한 구조(`SectionTitle` + 가로 스크롤 `ScrollView` + `KcisaExhibitionCard`)의 "인기 전시" 섹션이 최대 10개 카드로 노출되며, 카드는 인기 점수 내림차순으로 배치되고, 각 카드에 순위 번호(1부터)가 표시된다.

### AC-7: 인기 전시 카드 탭 → 전시 상세 이동

- **Given** 홈 화면에 인기 전시 섹션이 렌더링된 상태에서
- **When** 사용자가 인기 전시 카드 중 하나를 탭하면
- **Then** 해당 전시의 상세 화면(`/(explore)/{id}`)으로 이동하고, 로그인 사용자라면 AC-2에 따라 그 전시의 조회가 기록된다.

### AC-8: 로딩 · 에러 · 빈 상태 처리

- **Given** 인기 랭킹 집계 요청이 진행 중이거나, 실패했거나, 결과가 0건인 상태에서
- **When** 사용자가 홈 화면을 열면
- **Then** 로딩 중에는 기존 섹션과 동일한 `CenteredLoader`가 섹션 영역에 표시되고, 실패 시에는 `RetryErrorState`가 재시도 버튼과 함께 표시되며, 결과 0건이면 인기 전시 섹션 전체가 렌더링되지 않는다(빈 헤더만 남지 않는다). 어떤 경우에도 홈 화면의 나머지 섹션(`ExploreHomeHero`, `FeaturedCarousel`, `KcisaSection`, `추천 전시`)은 정상 렌더링된다.

## Screens / routes

| Route | 변경 |
|-------|------|
| `app/(tabs)/index.tsx` | 인기 전시 섹션 컴포넌트 추가 (기존 섹션 사이에 배치, 위치는 Open questions 참고) |
| `app/(explore)/[id].tsx` | 전시 조회 기록 훅 호출 추가 (UI 변경 없음) |
| `src/components/explore/PopularSection.tsx` (신규) | `KcisaSection` 패턴을 따른 인기 전시 섹션 — `SectionTitle` + 가로 스크롤 + `KcisaExhibitionCard` 재사용 |
| `src/hooks/usePopularExhibitions.ts` (신규) | 인기 랭킹 집계 조회 + 표시 정보 조인 → `ExhibitionSummary[]` 반환 |
| `src/hooks/useRecordExhibitionView.ts` (신규) | 로그인 사용자 상세 진입 시 조회 기록 |
| `supabase/migrations/{timestamp}_create_exhibition_views.sql` (신규) | `exhibition_views` 테이블 + RLS 정책 + 인기 랭킹 집계 함수 |
| `src/types/database.types.ts` | `exhibition_views` 테이블 타입 및 RPC 타입 추가 |

기존 재사용 자산 (변경 없음): `src/components/explore/KcisaExhibitionCard.tsx`, `src/components/common/SectionTitle.tsx`, `src/components/common/CenteredLoader.tsx`, `src/components/common/RetryErrorState.tsx`, `src/hooks/useExploreScreenData.ts`의 `ExhibitionSummary` 타입.

## Risks & dependencies

- **[P0] RLS로 인해 전체 사용자 집계가 클라이언트에서 불가능하다.** `bookmark_exhibitions`의 SELECT 정책은 `auth.uid() = user_id`로 제한되어 있다(`supabase/migrations/20260819000000_create_user_bookmarks.sql`). 따라서 `.select('exhibition_id', { count })` 류의 클라이언트 집계는 **자기 자신의 북마크만 세게 되어 조용히 잘못된 결과를 낸다.** `security definer` RPC 함수 또는 집계 전용 뷰가 필수다. Chris는 이 함수를 마이그레이션에 포함해야 하고, Taylor는 **서로 다른 두 계정으로 데이터를 만들어** 교차 집계가 맞는지 검증해야 한다.
- **[P1] 전시 마스터 테이블 부재.** `exhibition_id`는 외부 API(KCISA/Culture) 문자열 ID이므로, 집계 결과의 ID가 현재 홈에서 로드 중인 전시 목록(`useKcisaExhibitions`, `useCultureExhibitions`)에 존재하지 않을 수 있다(종료된 전시, 다른 소스의 전시 등). 표시 정보를 찾지 못한 ID는 섹션에서 **제외**한다 — 이 필터링 때문에 최종 카드 수가 10개 미만이 될 수 있으며 이는 정상 동작이다.
- **[P1] 콜드 스타트.** 초기에는 북마크·조회 데이터가 거의 없어 점수가 0~1에 몰리고 순위가 무의미할 수 있다. AC-8의 "0건이면 섹션 숨김"이 최소 방어선이다. 최소 노출 임계치(예: 점수 2 미만 제외) 도입 여부는 Open questions로 남긴다.
- **[P2] 상세 화면 재진입 시 중복 호출.** `app/(explore)/[id].tsx`는 몰입모드 플로우에서 여러 번 재진입될 수 있다(ARCHITECTURE.md §2). DB unique 제약이 최종 방어선이지만, 같은 세션 내 반복 호출은 클라이언트에서도 억제하는 편이 낫다.
- **[P2] 테스트 자산 부족.** 현재 Jest 테스트는 `src/utils/__tests__/exhibitionSearch.test.ts` 하나뿐이다(STATUS.md §7). 인기 점수 계산·정렬 로직은 순수 함수로 분리해 테스트 가능하게 만드는 것이 바람직하다.
- **의존성**: Supabase 프로젝트에 마이그레이션 적용 권한 필요. 로컬 시뮬레이터 검증을 위해 서로 다른 두 개 이상의 테스트 계정이 필요하다.

## Open questions (for Manager → user)

- [ ] 홈 화면에서 인기 전시 섹션의 배치 위치 — John의 제안은 `FeaturedCarousel` 바로 다음, `KcisaSection` 앞이다(가장 강한 사회적 증거를 상단에, 개인화 섹션은 하단 유지). 확정 필요.
- [ ] 섹션 제목·eyebrow 카피 — 제안: eyebrow `TRENDING NOW` / title `지금 인기 있는 전시`. 기존 섹션(`PUBLIC MUSEUMS` / `국공립 기관 전시`, `FOR YOU` / `추천 전시`)과 톤을 맞춘 안이다. Sam이 02-design-brief에서 확정해도 무방.
- [ ] 콜드 스타트 최소 노출 임계치 — 인기 점수가 특정 값(예: 2) 미만인 전시는 제외할지, 아니면 데이터가 적어도 그대로 노출할지. John의 기본값은 **임계치 없음**(0건일 때만 섹션 숨김, AC-8)이며 이대로 진행 가능하다.
- [ ] "더보기" 액션 필요 여부 — `KcisaSection`은 검색 화면으로 가는 더보기가 있다. 인기 전시는 대응하는 목록 화면이 없어 John의 기본값은 **더보기 없음**이다.

## Feature breakdown (for Chris)

1. **AC-1** — `supabase/migrations/{timestamp}_create_exhibition_views.sql` 작성: `exhibition_views` 테이블 + `(user_id, exhibition_id, viewed_date)` PK + RLS 정책(본인 행 select/insert) + `security definer` 인기 랭킹 집계 함수. `src/types/database.types.ts` 갱신 후 `npx tsc --noEmit`.
2. **AC-2** — `src/hooks/useRecordExhibitionView.ts` 신규 작성 후 `app/(explore)/[id].tsx`에서 호출. 실패는 조용히 무시(사용자 노출 없음).
3. **AC-3** — dedup 동작 확인: `on conflict do nothing` 경로 + 같은 세션 반복 호출 억제.
4. **AC-4** — 훅 내부에서 `useAuthStore` 세션 부재 시 조기 return(네트워크 호출 자체를 하지 않음).
5. **AC-5** — 집계 RPC 호출 + 점수 정렬·상위 20건 결과를 반환하는 데이터 계층. 정렬/점수 계산 중 순수 함수로 뽑을 수 있는 부분은 `src/utils/`로 분리하고 Jest 테스트 추가.
6. **AC-6** — `src/hooks/usePopularExhibitions.ts`(집계 결과 + 표시 정보 조인 → `ExhibitionSummary[]`, 최대 10건) 및 `src/components/explore/PopularSection.tsx` 작성 후 `app/(tabs)/index.tsx`에 배치.
7. **AC-7** — 카드 `onPress`를 기존 `openExhibition`에 연결하고 AC-2 기록 경로까지 이어지는지 확인.
8. **AC-8** — 로딩(`CenteredLoader`) / 에러(`RetryErrorState` + refetch) / 빈 상태(섹션 전체 미렌더) 분기 처리. `component-convention.md` §11(긍정 조건 우선, 삼항 중첩 금지 → `renderContent()` 분리)을 따를 것.
