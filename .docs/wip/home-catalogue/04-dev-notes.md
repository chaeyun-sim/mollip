---
feature-slug: home-catalogue
author: chris
---

# Dev notes

## 변경 파일

| 파일                                               | 내용                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/(tabs)/index.tsx`                             | 캐러셀(FlatList·페이지 표시)·FAB·오늘의 명화 제거. 마스트헤드(날짜 + AI 도슨트) → 검색 + 지도 → 01 커버 → 02 마감 → 03 추천. 섹션 번호는 보이는 섹션 기준으로 연속 계산  |
| `src/components/home/HomeSectionHeader.tsx`        | `index` prop 추가 — `01` + 1px 룰 + Hahmlet 24                                                                                                                           |
| `src/components/home/HomeCoverSpread.tsx` (신규)   | 커버 4:5 + 2열 도판, 포스터 위 오버레이 없음                                                                                                                             |
| `src/components/home/HomeIndexRow.tsx` (신규)      | 목차형 행 (마감·추천 2곳 재사용)                                                                                                                                         |
| `src/components/home/HomeIndexSkeleton.tsx` (신규) | 목차형 로딩 스켈레톤                                                                                                                                                     |
| `src/components/home/ClosingSoonIndex.tsx` (신규)  | `ClosingSoonRail` 대체 — D-day 목차 최대 5개                                                                                                                             |
| `src/components/home/RecommendedIndex.tsx` (신규)  | `RecommendedGrid` 대체 — 순번 목차 최대 4개                                                                                                                              |
| `src/utils/homeExhibitionMeta.ts`                  | `formatHomeDate` 추가 (+테스트)                                                                                                                                          |
| 삭제                                               | `ClosingSoonRail`, `RecommendedGrid`, `DailyArtworkBand`, `HomeExhibitionMeta`, `explore/FeaturedExhibitionHero`, `utils/featuredPaging`(+테스트) — 홈 전용이라 사용처 0 |

## 사용자 피드백 반영 (구현 중)

1. 검색바 옆 지도 버튼 유지 → 도슨트 버튼은 날짜 줄 오른쪽으로 이동.
2. 오늘의 명화 섹션 홈에서 제거 (사용자가 직접 JSX 삭제 후 확인).

## 남겨둔 것

- `useDailyArtwork` · `dailyArtworkStore` · `data/dailyArtworks`(+테스트)는 이제 앱 어디서도 쓰지 않는다. 진행 기록 로직이 있어 다른 화면에서 재사용할 수 있으므로 이번 diff에서는 삭제하지 않았다.

## 수정 이력

- 도판 캡션이 열 폭을 넘어 한 줄로 삐져나감 → Pressable 함수형 style의 width가 Text 래핑 폭에 반영되지 않아, 내부 `View`에 폭을 고정해 해결.

## 사용자 피드백 반영 (handoff 후)

- AI 도슨트 버튼을 날짜 줄에서 우하단 확장형 FAB(`bg-gray900`, 52px)로 이동. 날짜 줄은 사용자가 주석 처리 → 빈 줄이 되어 줄째 제거(`formatHomeDate` 유틸·테스트는 유지). FAB에 마지막 행이 가리지 않도록 스크롤 하단 여백 `pb-28`. 증빙 `evidence/fab-top.png`, `fab-tap.png`.
