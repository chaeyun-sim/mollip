---
feature-slug: exhibition-popularity-ranking
author: chris
status: in-progress
---

# Dev notes — 전시 인기 랭킹

## Implemented ACs

| AC | Status | Files |
|----|--------|-------|
| AC-1 조회 기록 테이블 마이그레이션 | 코드 작성 완료 · **DB 미적용(Manager 승인 대기)** | `supabase/migrations/20260826000000_create_exhibition_views.sql`, `src/types/database.types.ts` |
| AC-2 로그인 사용자 조회 기록 | 구현 완료 · 런타임 검증 대기 | `src/hooks/useRecordExhibitionView.ts`, `app/(explore)/[id].tsx` |
| AC-3 동일 사용자·전시·날짜 중복 제거 | 구현 완료 · 런타임 검증 대기 | `src/hooks/useRecordExhibitionView.ts`(세션 캐시) + 마이그레이션 PK(`on conflict do nothing`) |
| AC-4 비로그인 사용자 미기록 | 구현 완료 · 런타임 검증 대기 | `src/hooks/useRecordExhibitionView.ts` (`userId` 없으면 effect 조기 return — 네트워크 호출 없음) |
| AC-5 인기 점수 집계 결과 반환 | 구현 완료 · Jest 통과 · 런타임 검증 대기 | `supabase/migrations/...sql`(가중치 상수), `src/utils/popularExhibitions.ts`, `src/utils/__tests__/popularExhibitions.test.ts`, `src/hooks/usePopularExhibitions.ts` |
| AC-6 홈 "인기 전시" 섹션 노출 | 구현 완료 · 런타임 검증 대기 | `src/components/explore/PopularSection.tsx`, `app/(tabs)/index.tsx` |
| AC-7 카드 탭 → 전시 상세 이동 | 구현 완료 · 런타임 검증 대기 | `app/(tabs)/index.tsx` (`openExhibition` 재사용) |
| AC-8 로딩·에러·빈 상태 | 구현 완료 · 런타임 검증 대기 | `src/components/explore/PopularSection.tsx` (`renderContent()` 분리) |

자체 확인 결과: `npx tsc --noEmit` 0 errors / `npx jest` 2 suites · 37 tests 통과(신규 9건 포함).

## Changed files

신규
- `supabase/migrations/20260826000000_create_exhibition_views.sql` — `exhibition_views` 테이블 + RLS 2개 정책 + 보조 인덱스 + `get_popular_exhibitions(p_limit)` security definer 함수 + grant
- `src/hooks/useRecordExhibitionView.ts` — 상세 진입 시 조회 기록(로그인 한정, 세션 캐시 dedup, 실패 무시)
- `src/hooks/usePopularExhibitions.ts` — 집계 RPC 호출 + `exhibitions` 표시 정보 조인 → `ExhibitionSummary[]`
- `src/utils/popularExhibitions.ts` — `sortPopularEntries` / `buildPopularExhibitions` 순수 함수 + `POPULAR_RANKING_LIMIT`(20) · `POPULAR_SECTION_SIZE`(10)
- `src/utils/__tests__/popularExhibitions.test.ts` — 정렬·조인·제외·limit·중복·빈 결과 9케이스
- `src/components/explore/PopularSection.tsx` — `KcisaSection` 구조 복제, eyebrow `POPULAR NOW` / title `지금 인기 있는 전시`

수정
- `src/types/database.types.ts` — `exhibition_views` Row/Insert/Update/Relationships + `get_popular_exhibitions` Functions 타입 (마이그레이션 적용 후 `npm run gen:types` 재생성 권장)
- `app/(explore)/[id].tsx` — `useRecordExhibitionView(id, !!exhibition)` 1줄 + import (UI 변경 없음)
- `app/(tabs)/index.tsx` — `usePopularExhibitions` 호출 + `FeaturedCarousel`과 `KcisaSection` 사이에 `<PopularSection />` 배치

`KcisaExhibitionCard` / `SectionTitle` / `StatusBadge` / `CenteredLoader` / `RetryErrorState`는 **수정하지 않았다**(02-design-brief 선언 준수).

## 중복 노출 처리 판단 (Alex Suggestion 1)

**결정: 인기 목록에서 `FeaturedCarousel`에 노출 중인 전시 ID(최대 5개)를 제외한다.**

- 구현: `app/(tabs)/index.tsx`에서 `usePopularExhibitions(featuredCarousel.map((item) => item.id))` — 제외 로직 자체는 순수 함수 `buildPopularExhibitions({ excludeIds })`에 있고 Jest로 커버된다.
- 근거 1 (일관성): 홈에는 이미 같은 회피 규칙이 있다. `KcisaSection`은 `useExploreScreenData`의 `kcisaCarousel`에서 `featuredCarousel.length`만큼 슬라이스해 히어로에 걸린 전시를 뺀다. 인기 섹션만 예외로 두면 "왜 여기만 중복되나"라는 불일치가 생긴다.
- 근거 2 (인접성): 확정된 세로 순서가 `FeaturedCarousel → PopularSection`이라 중복 시 **바로 붙어서** 같은 포스터가 두 번 보인다. 화면을 스크롤하지 않고 동시에 인지되는 위치라 중복 비용이 가장 큰 배치다.
- 근거 3 (정보량): 인기 섹션의 가치는 "히어로에 없는 것 중 다수가 선택한 전시"를 보여주는 데 있다. 중복 카드는 새 정보를 0으로 만들고 슬롯 하나를 소모한다.
- 감수한 리스크: 콜드스타트에 점수 보유 전시가 5개 이하이고 그게 전부 featured와 겹치면 섹션이 통째로 사라진다. 02-design-brief States가 "0건이면 조용히 미렌더"를 이미 정의했고 임계치도 두지 않기로 했으므로 사용자에게 노출되는 실패 모드는 없다.
- 제외 대상은 **히어로 1개가 아니라 `featuredCarousel` 5개 전부**다. 캐러셀은 사용자가 스와이프해 5개를 모두 볼 수 있으므로 1번째만 빼는 것은 방어가 부분적이다.

## Deviations from spec/brief

1. **표시 정보 조인 소스** — 01-spec은 "기존 전시 데이터 훅(`useKcisaExhibitions`/`useCultureExhibitions`)에서 조인"을 상정했으나, 이 훅들은 각각 상위 10건만 로드해 인기 상위 20건을 커버하지 못한다. 대신 `usePopularExhibitions`가 집계된 ID로 `exhibitions` 테이블을 직접 `.in('id', ids)` 조회한다. 결과적으로 P1 리스크(표시 정보 미발견으로 카드 수 감소)가 크게 줄어든다. 표시 정보를 못 찾은 ID를 제외하는 동작 자체는 스펙대로 유지된다.
2. **종료 전시 제외** — 표시 정보 조회에 홈의 다른 섹션과 동일한 필터(`applyExhibitionDateFilters` + `end_date >= 오늘`)를 적용했다. 스펙에 명시 규정은 없으나, "지금 인기 있는 전시" 섹션에 이미 종료된 전시가 뜨는 것은 카피와 모순되고 홈의 다른 레일(모두 진행/예정만 노출)과도 어긋난다. 제외를 원치 않으면 `usePopularExhibitions`의 `.gte('end_date', ...)` 한 줄을 지우면 된다.
3. **`viewed_date` 값 결정 주체** — 클라이언트가 날짜를 보내지 않고 DB default(`Asia/Seoul` 기준 오늘)를 쓴다. 기기 시계 오조작으로 하루 여러 행이 생기는 것을 막기 위함이다. 클라이언트 세션 캐시 키는 기기 로컬 날짜를 쓰므로 자정 경계에서 캐시 키와 DB 행 날짜가 어긋날 수 있으나, 그 경우에도 DB PK가 중복을 막으므로 AC-3은 깨지지 않는다.
4. **`status` 초기값** — `usePopularExhibitions`의 초기 상태를 `idle`이 아닌 `loading`으로 두었다. `idle` 한 프레임 동안 섹션이 `null`로 렌더됐다가 로더로 바뀌는 깜빡임을 없애기 위함이다.

## Blockers for Taylor (QA)

1. **[P0 · 구조적 차단] 마이그레이션이 원격 DB에 적용되지 않았다.** Manager 지시에 따라 `supabase db push`를 실행하지 않았다. 적용 전에는 `get_popular_exhibitions` RPC가 존재하지 않아(PostgREST `PGRST202`) **홈의 인기 전시 섹션이 항상 에러 상태(`인기 전시를 불러오지 못했어요` + 다시 시도)로 렌더된다.** 조회 기록(AC-2~4)도 `exhibition_views` 테이블 부재로 실패하며, 실패는 조용히 무시되어 상세 화면 동작에는 영향이 없다. AC-1·2·3·5·6(성공 경로)·7의 런타임 검증은 마이그레이션 적용 이후에만 가능하다.
2. **교차 계정 검증 필요(01-spec Risks P0)** — RLS 우회가 실제로 되는지 확인하려면 **서로 다른 두 계정**으로 북마크/조회를 만든 뒤, 한 계정으로 로그인한 상태에서 인기 목록에 상대 계정 기여분이 반영되는지 봐야 한다. 단일 계정 검증은 security definer 결함을 잡지 못한다.
3. **비로그인 검증 방법** — AC-4는 "네트워크 호출 자체가 없어야" 하므로 육안 확인만으로는 부족하다. 로그아웃 상태에서 상세 진입 시 `exhibition_views` 요청이 나가지 않는지(콘솔/네트워크 로그) 확인 필요.
4. **회귀 경로** — 홈(`FeaturedCarousel`·`KcisaSection`·추천 섹션이 그대로 렌더되는지), 전시 상세(로딩/북마크/몰입모드 진입), 검색 → 상세 이동.
5. **린트 기존 이슈** — `npx expo lint`는 저장소 전체에서 66건의 `react-hooks/set-state-in-effect` 오류가 이미 존재한다(`useKcisaExhibitions`, `useVenueExhibitions` 등). `usePopularExhibitions`도 동일 패턴이라 같은 규칙에 1건 걸리며, 이는 기존 데이터 훅 컨벤션을 따른 결과다. 신규 파일에서 그 외 lint 오류는 0건.

## Native / env notes

- 네이티브 모듈 추가·제거 **없음** → `pod install` / `npx expo run:ios` 리빌드 불필요. JS 리로드로 충분하다.
- 신규 의존성 **없음**.
- 필요한 것은 DB 마이그레이션 적용뿐이다: `supabase db push` (또는 대시보드에서 SQL 실행) → 이후 `npm run gen:types`로 `src/types/database.types.ts` 재생성 권장(현재는 수기로 반영해 둔 상태이며 실제 스키마와 일치한다).
- 시뮬레이터(iPhone 15, iOS 17.0)는 부팅되어 있으나 앱/Metro가 실행 중이 아니어서(스크린샷 백지) 비주얼·인터랙션 검증은 수행하지 않았다. 증빙: `.docs/wip/exhibition-popularity-ranking/evidence/pre-check.png`. 통과했다고 주장하지 않는다.
