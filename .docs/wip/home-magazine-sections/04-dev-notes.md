---
feature-slug: home-magazine-sections
author: chris
---

# Dev notes

## 변경 파일

| 파일                                                                     | 내용                                                                                                                 |
| :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `app/(tabs)/index.tsx`                                                   | 섹션 순서 재배치, 마감 임박·명화 연결, 섹션 간 중복 제거(`aboveClosingIds` → `shownAboveIds`), 명화 해설 진입 핸들러 |
| `src/components/home/PopularCollection.tsx`                              | TOP 5 랭킹 (Hahmlet 순위 숫자 + 썸네일 + D-day/기간)                                                                 |
| `src/components/home/ClosingSoonRail.tsx` (신규)                         | 한 달 내 마감 레일, 14일 이내 칩은 `bg-primary-dark`                                                                 |
| `src/components/home/DailyArtworkBand.tsx` (신규)                        | 다크 밴드 "오늘의 명화" + AI 도슨트 CTA                                                                              |
| `src/components/home/RecommendedGrid.tsx`                                | 매거진: 이미지 있는 전시를 리드 커버로, 나머지 2열                                                                   |
| `src/components/home/NationalGallery.tsx`                                | 와이드 커버 + 정사각 레일, `featured` prop 제거(중복 제거로 대체)                                                    |
| `src/components/home/HomeSectionHeader.tsx`                              | eyebrow 제거, `subtitle` 추가                                                                                        |
| `src/components/home/HomeExhibitionMeta.tsx` (신규)                      | D-day/기간 라벨 (4곳 공용)                                                                                           |
| `src/utils/homeExhibitionMeta.ts` (+테스트 13)                           | `getExhibitionMeta`, `pickClosingSoon`, `getDailyIndex`                                                              |
| `src/data/dailyArtworks.ts` (신규)                                       | Met 퍼블릭 도메인 13점 (curl로 ID 검증)                                                                              |
| `src/hooks/queries/useDailyArtwork.ts` (신규)                            | Met 이미지 조회, 1일 캐시                                                                                            |
| `src/api/met.ts`                                                         | `getMetObjectImage` 추가                                                                                             |
| `useExploreScreenData` / `useKcisaExhibitions` / `usePopularExhibitions` | `startDate`/`endDate` 선택 필드 전달                                                                                 |

## 스펙 대비 조정

- 마감 임박 범위 14일 → **30일**: 14일만으로는 실데이터 1~3건이라 레일이 비어 보임. 강조색 기준은 14일 유지.
- 디자인 리뷰 반영: 4~5위 `text-gray600`, 구분선 `border-b-[0.5px]`(`h-hairline`은 높이로 동작 안 함 확인), 출처 `/60`.

## 사용자 피드백 반영 (폰트)

- Hahmlet은 섹션 제목(`HomeSectionHeader`, "오늘의 명화")에만 남기고, 순위 숫자·D-day 칩·명화 작품명·추천/국립 커버 제목은 Pretendard(semibold/bold)로 변경. 시뮬레이터 확인: `evidence/font-*.png`.

## 사용자 피드백 반영 (2차)

- 곧 막을 내려요: 마감일 당일(철수일일 수 있음) 제외 — `pickClosingSoon`에 `minDays` 옵션 추가(+테스트), 레일에서 `minDays: 1`.
- 지금 많이 찾는 전시: 가로 포스터 랭킹 → **벤토 타일**(1위 큰 세로 타일 + 2~5위 2×2), 타일 좌상단 큰 흰 순위 숫자. 증빙 `evidence/popular-bento*.png`.

## 사용자 피드백 반영 (3차 — 홈 데이터 축소)

- 국립 미술관·박물관 섹션 제거(`NationalGallery.tsx` 삭제). 데이터 출처 기준 그룹이라 사용자 가치가 낮고 캐러셀·인기와 중복.
- 추천은 선호 장르가 있는 사용자에게만 표시(비개인화 대체 목록 숨김), 남은 항목이 0이면 섹션 숨김.
- 홈 구성: 캐러셀 → 인기 TOP 5 → 곧 막을 내려요 → 오늘의 명화 → (개인화) 추천. 증빙 `evidence/home-trimmed-bottom.png`.

## 사용자 피드백 반영 (4차)

- 추천: 리드 카드 제거 → 2×2 그리드(최대 4개, 짝수로 맞춤, 이미지 있는 전시 우선). 증빙 `evidence/rec-2x2.png`.
- 오늘의 명화: 13점 → 73점(약 2달 반 주기). Met v1.1 search로 유럽 회화·아시아 미술 isHighlight 후보 350점 → 퍼블릭 도메인+이미지 205점 → 한국어 제목이 확실한 대표작 선별(조선 회화 5점 포함). 73점 전부 Object API로 재확인. 데이터 검증 테스트 `src/data/__tests__/dailyArtworks.test.ts` 추가.
- 범위 밖 발견: Met `/public/collection/v1/search`가 2026-10-01 폐기됨 → 기존 `searchMetArtworks`(작품 검색)가 Met 결과를 못 받는 상태. v1.1(offset/limit 페이지네이션)로 이관 필요.

## 사용자 피드백 반영 (5차 — 명화 진행 방식)

- 날짜 고정 순환 → **해설을 들은 다음 날에만 다음 그림**. 듣지 않으면 유지, 며칠 만에 와도 한 칸만 이동.
- `src/utils/dailyArtworkProgress.ts`(+테스트 8) · `src/store/dailyArtworkStore.ts`(AsyncStorage, 기기 저장) · `useDailyArtwork`(복원 전 null, 홈 포커스마다 날짜 동기화) · 홈 CTA에서 프리미엄 사용자가 해설 화면으로 넘어갈 때 기록.
- 시뮬레이터: 복원 후 밴드 렌더 확인(`evidence/artwork-progress.png`). 다음 날 전환은 단위 테스트로만 검증(기기 날짜 변경 미실행), CTA 탭은 실제 AI 해설 생성 비용 때문에 재실행하지 않음.

## 사용자 피드백 반영 (6차 — 순서)

- 홈 순서: 캐러셀 → 인기 TOP 5 → 곧 막을 내려요 → (개인화) 추천 → **오늘의 명화(맨 아래)**. 명화가 있을 때는 다크 밴드가 화면 끝까지 이어지도록 스크롤 하단 여백 대신 밴드 `pb-32`. 증빙 `evidence/home-order-bottom.png`.

## 사용자 피드백 반영 (7차)

- 곧 막을 내려요: 범위 30일 → **14일**(검색 필터와 동일 기준, `CLOSING_SOON_DAYS`/`CLOSING_SOON_MIN_DAYS`), 부제 '2주 안에 끝나는 전시', 칩 전부 `bg-primary-dark`, 헤더 우측 **전체 >** → `/search?closing=1`.
- 검색: '마감 임박' 칩 추가(`getClosingSoonDaysLeft` 1~14일, +테스트), 켜져 있으면 검색어 없이도 목록 표시·마감 빠른 순 정렬·자동 포커스 끔. 증빙 `evidence/closing-search.png`(75건, 마감 빠른 순).
- Met 검색: v1/search 폐기(410) → v1.1 + `limit=12`로 수정. 재현 테스트 `src/api/__tests__/met.test.ts`(수정 전 `met-search 410` 실패 확인), 실 엔드포인트 응답 확인.
- 검색 마감 임박 목록: 결과 카드의 '진행 중' 배지 숨김, D-day를 14일까지 표시(`ExhibitionResultCard` `closingSoon` prop). 증빙 `evidence/closing-search-v2.png`, `closing-search-d14.png`.
- 범위 밖 버그 수정(사용자 요청): 전시 상세 기간 줄 `D-D-n` → `D-n` (`ExhibitionVenueInfo.tsx`에서 이미 'D-n'인 라벨에 'D-' 접두사를 중복으로 붙이던 것 제거). RN 컴포넌트 테스트 환경이 없어 재현 테스트 대신 시뮬레이터로 확인(`evidence/detail-dday-fix.png`).

## 사용자 피드백 반영 (8차 — 인기 섹션 제거)

- '지금 많이 찾는 전시' 섹션 제거(`PopularCollection.tsx` 삭제). 캐러셀의 '인기 전시' 자리와 겹치고, 포스터 섹션 3연속이 산만해 보인다는 피드백. 인기 데이터는 캐러셀 선정에만 사용.
- 중복 제거 기준을 캐러셀 → 마감 임박 → 추천으로 단순화.
- 홈 구성: 캐러셀 → 곧 막을 내려요 → (개인화) 추천 → 오늘의 명화. 증빙 `evidence/home-no-popular-1.png`, `-2.png`.
