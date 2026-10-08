---
feature-slug: home-discovery-sections
author: chris
status: done
---

# Dev notes

## Implemented ACs

| AC               | Status                    | Files                                                                         |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------- |
| AC-1 인기 컬렉션 | Done                      | `src/components/home/PopularCollection.tsx`                                   |
| AC-2 국립 갤러리 | Done                      | `src/components/home/NationalGallery.tsx`                                     |
| AC-3 추천 그리드 | Done                      | `src/components/home/RecommendedGrid.tsx`, `src/utils/homeLayout.ts` (+ test) |
| AC-4 통합        | 부분 — 아래 "미검증" 참고 | `app/(tabs)/index.tsx`                                                        |

## Implementation decisions

- 공통 헤더/에러·빈 상태는 3곳 사용이라 `HomeSectionHeader`, `HomeSectionMessage`로 추출. 공용 `SectionTitle`/`HorizontalSection`/카드는 수정하지 않음.
- 인기 행은 기존 7개 → **5행**으로 제한(스크롤 길이). 중복 제거(`featuredTrioIds`)·쿼리는 그대로.
- 국립 섹션 숨김 조건(`!showSection && featured.source==='kcisa'`)을 `NationalGallery`로 그대로 이식.
- 밴드는 기존 `image-placeholder` 토큰. 번호 오버레이(`01/02`)·원형 아바타 제거.
- **발견한 렌더링 이슈 2건과 수정**
  1. NativeWind에서 `px-6`이 24가 아닌 ≈21px로 렌더링(inlineRem 14) → 폭 계산과 어긋나 그리드가 1열로 줄바꿈. 새 컴포넌트의 좌우 여백·간격을 `style` 상수(`HOME_SIDE_PADDING=24`, gap)로 고정하고 그리드는 2개씩 행으로 렌더링.
  2. `Pressable`의 함수형 `style`에 준 `width`가 적용되지 않아 캡션이 포스터 폭을 넘음 → 폭을 안쪽 `View`로 이동.

## Changed files

- `app/(tabs)/index.tsx` (하단 3섹션 교체, 불필요 import 제거)
- 신규: `src/components/home/{HomeSectionHeader,HomeSectionMessage,PopularCollection,NationalGallery,RecommendedGrid}.tsx`, `src/utils/homeLayout.ts`, `src/utils/__tests__/homeLayout.test.ts`
- `skills-lock.json` 등 기존 더티 변경은 건드리지 않음.

## Deviations from spec/brief

- 인기 7→5행(브리프에 명시). 그 외 None.
- 로딩 스켈레톤(추천)은 아직 `flex-wrap` — 로딩 상태 시각 확인 못 함.

## Blockers for Taylor (QA)

- 시뮬레이터가 중간에 종료됨(아래 QA 보고서).

## Native / env notes

- 신규 네이티브 모듈 없음.
