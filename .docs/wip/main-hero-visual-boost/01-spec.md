---
feature-slug: main-hero-visual-boost
tier: M
author: john
status: draft
---

# Spec — 메인 화면 히어로 비주얼 강화

## Problem

- `app/(tabs)/index.tsx` 메인 화면이 톤온톤 배경 위에 텍스트 위주 히어로 카드로 구성돼 있어, 사용자가 "눈길을 끄는 디자인이 아니다"라고 느낌.
- 히어로 카드(`ExploreHomeHero`)·오늘의 전시 카드(`FeaturedExhibitionHero`)·추천 전시 리드 카드가 각각 존재하지만 시각적 임팩트(대비, 크기, 배지)가 약해 스크롤 시 시선을 끌지 못함.

## Goals

- 레이아웃 큰 골격(헤더 → 히어로 → 오늘의 전시 → KCISA 섹션 → 추천 전시 → FAB)은 유지한 채, 상단 히어로 영역의 비주얼 임팩트를 강화한다.
- 이미지 크기·그라데이션 대비·타이포 웨이트를 키워 "일반적이지만 다양한" 느낌을 준다.
- 기존 디자인 토큰(`#F8F6F2`/`#1C1917`, Pretendard/Hahmlet)과 컴포넌트 컨벤션을 그대로 준수한다.

## Non-goals (out of scope)

- 네비게이션 구조·라우팅 변경
- 새 화면 추가
- `useExploreScreenData` 등 데이터 페칭/비즈니스 로직 변경
- FAB(몰입 모드/카메라) 위치·기능 변경
- KCISA 섹션(`KcisaSection`) 내부 구현 변경 — 이번 스코프는 히어로·오늘의 전시·추천 리드 카드로 한정

## Users & context

- 메인 탭에 진입하는 모든 사용자. 첫 화면인 만큼 첫인상이 앱 전체 인상을 좌우.

## Acceptance criteria

### AC-1: 상단 히어로 카드(ExploreHomeHero) 비주얼 강화

- **Given** 사용자가 메인 화면에 진입했을 때
- **When** 최상단 히어로 카드를 본다
- **Then** 조각상 이미지가 기존(72x100)보다 크게 보이고, 그라데이션 배경의 색 대비가 강화되어 텍스트와 이미지가 더 뚜렷하게 대비된다. 텍스트 계층(레이블 배지 → 타이틀 → 서브텍스트)은 유지하되 타이포 임팩트(굵기/크기)가 강화된다.

### AC-2: 오늘의 전시 카드(FeaturedExhibitionHero) 배지·타이포 강화

- **Given** `featured` 데이터가 있어 오늘의 전시 카드가 노출될 때
- **When** 카드를 본다
- **Then** "오늘의 전시" 라벨이 강조 배지(pill) 형태로 바뀌고, 타이틀 폰트 크기와 그라데이션 오버레이 대비가 강화되어 기존보다 시선을 더 끈다. 썸네일 없는 폴백 상태의 레이아웃도 동일한 강조 톤으로 맞춘다.

### AC-3: 추천 전시 리드 카드에 시각적 강조 배지 추가

- **Given** 추천 전시 섹션에 리드 카드(첫 번째 큰 카드)가 노출될 때
- **When** 카드를 본다
- **Then** 리드 카드에 작은 강조 배지(예: "PICK")가 추가되어 그리드의 다른 카드들과 시각적으로 구분되고, 그림자/대비가 소폭 강화된다. 그리드 카드(2열) 스타일은 변경하지 않는다.

## Screens / routes

| Route                                            | 변경                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `app/(tabs)/index.tsx`                           | 변경 없음 (하위 컴포넌트만 수정)                                       |
| `src/components/explore/ExploreHomeHero.tsx`     | AC-1                                                                   |
| `src/components/explore/ExploreHomeSections.tsx` | AC-2 (FeaturedExhibitionHero), AC-3 (RecommendedExhibitions 리드 카드) |

## Risks & dependencies

- 이미지 크기 확대 시 레이아웃 줄바꿈/오버플로우 가능 → 시뮬레이터 스크린샷으로 확인 필요.
- 그라데이션 대비 강화가 과해지면 텍스트 가독성(WCAG 대비) 저하 가능 → Sam 브리프에서 대비 값 명시.

## Open questions (for Manager → user)

- 없음 (AskUserQuestion으로 방향·범위 사전 확정됨: 히어로 비주얼 강화, Tier M)

## Feature breakdown (for Chris)

1. AC-1: `ExploreHomeHero` 이미지 크기/그라데이션/타이포 조정
2. AC-2: `FeaturedExhibitionHero` 배지·타이포·오버레이 조정
3. AC-3: `RecommendedExhibitions` 리드 카드에 배지 추가
