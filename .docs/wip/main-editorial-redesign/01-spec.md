---
feature-slug: main-editorial-redesign
tier: L
author: john
status: draft
---

# Spec — 메인 화면 에디토리얼(매거진) 구조 재설계

## Problem

- 이전 Tier M 작업(`main-hero-visual-boost`)으로 카드 3곳의 비주얼을 강화했지만, 사용자는 그 수준을 넘어 "완전히 갈아엎는" 구조적 재설계를 원함.
- 현재 구조(카드 나열형 — 히어로 카드 → 오늘의 전시 카드 → KCISA 가로 캐러셀 → 추천 전시 리드+2열 그리드)는 일반적인 앱 홈 패턴이라 차별점이 약함.
- 사용자가 확정한 방향: **구조 재설계(Tier L)**, 무드는 **에디토리얼/매거진 스타일**(큰 세리프 타이포, 여백, 비대칭 레이아웃, 계층적 크기 차이).

## Goals

- 헤더부터 추천 전시까지 전 섹션을 매거진 표지·인덱스 관습(마스트헤드, 커버스토리, 넘버링된 인덱스 리스트, 얇은 룰선, 스몰캡스 eyebrow)으로 재구성한다.
- Hahmlet(세리프) 타이포의 크기 대비를 극대화해 "편집된" 느낌을 준다.
- 기존 디자인 토큰(`#F8F6F2`/`#1C1917`)과 폰트 자산은 재사용하되, pill 배지 같은 일반적인 앱 UI 관습은 지양하고 룰선/넘버링 등 에디토리얼 관습으로 대체한다.
- 데이터 흐름(`useExploreScreenData`)과 라우팅은 절대 건드리지 않는다 — 같은 데이터를 다른 레이아웃에 담는다.

## Non-goals (out of scope)

- `useExploreScreenData`, `useCultureExhibitions`, `useKcisaExhibitions` 등 데이터 훅 로직 변경
- 네비게이션 구조·라우팅 변경, 새 화면 추가
- FAB(몰입 모드/카메라) 위치·기능·스타일 변경
- 다른 탭(지도/전시/다이어리/검색) 화면 변경
- 이전 Tier M PR(`main-hero-visual-boost`)의 커밋 여부 결정 — 이번 작업은 그 위에 구조를 갈아엎는 것으로, 기존 배지/이미지 크기 조정은 자연스럽게 대체되거나 제거될 수 있음

## Users & context

- 메인 탭 첫 진입 사용자 전체. 재방문 사용자도 포함되므로 핵심 동선(전시 상세 진입, 카메라/몰입모드 진입)은 유지되어야 함.

## Acceptance criteria

### AC-1: 마스트헤드 헤더 재설계

- **Given** 사용자가 메인 화면에 진입했을 때
- **When** 최상단 헤더를 본다
- **Then** 로고가 더 큰 세리프(Hahmlet) 스타일로 강조되고, 로고 아래 얇은 룰선(divider)과 오늘 날짜 기반의 매거진식 eyebrow 텍스트(예: "2026.08.25 · EXPLORE")가 추가된다. 마이페이지 버튼은 유지된다.

### AC-2: 히어로를 에디토리얼 커버 레이아웃으로 재설계

- **Given** 헤더 바로 아래 히어로 영역을 볼 때
- **When** 화면을 본다
- **Then** 기존 그라데이션 카드 박스가 사라지고, 배경색(bg-light) 위에 비대칭 2단 구성(큰 세리프 헤드라인 + 얇은 룰선 + 캡션)으로 바뀐다. 조각상 이미지는 헤드라인과 겹치거나 프레임 밖으로 자연스럽게 걸치는 형태로 재배치된다.

### AC-3: "오늘의 전시"를 커버스토리 편집 스타일로 재설계

- **Given** `featured` 데이터가 있어 카드가 노출될 때
- **When** 카드를 본다
- **Then** 흰 pill 배지 대신 스몰캡스 eyebrow("COVER STORY") + 얇은 흰 룰선으로 라벨을 표현하고, 타이틀은 더 큰 세리프 크기로 강조된다. 이미지 비율은 기존보다 세로로 더 길게(에디토리얼 커버 비율) 조정된다.

### AC-4: 추천 전시를 넘버링 인덱스 리스트로 재구성

- **Given** 추천 전시 섹션에 진입했을 때
- **When** 목록을 본다
- **Then** 기존 "리드 카드 + 2열 그리드" 구조 대신, 리드 피처(가장 큰 항목 1개, 기존과 유사한 큰 썸네일) + 나머지 항목은 "01 · 제목 — 장소" 형태의 넘버링된 가로 리스트(작은 썸네일 + 텍스트, 얇은 구분선)로 표시된다.

### AC-5: KCISA 섹션에 에디토리얼 넘버링 적용

- **Given** KCISA 가로 캐러셀 섹션을 볼 때
- **When** 카드들을 본다
- **Then** 각 카드 좌상단에 작은 인덱스 번호(01, 02, 03…)가 표시되어 매거진 인덱스 느낌이 통일된다. 캐러셀 스크롤 동작 자체는 변경하지 않는다.

## Screens / routes

| Route                                            | 변경                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `app/(tabs)/index.tsx`                           | 헤더 구성 변경(AC-1), 하위 컴포넌트 교체                             |
| `src/components/explore/ExploreHomeHero.tsx`     | AC-2 (전면 재작성)                                                   |
| `src/components/explore/ExploreHomeSections.tsx` | AC-3(FeaturedExhibitionHero), AC-4(RecommendedExhibitions 구조 변경) |
| `src/components/explore/KcisaExhibitionCard.tsx` | AC-5 (넘버 배지 추가)                                                |
| `src/components/explore/KcisaSection.tsx`        | AC-5 (넘버 전달)                                                     |
| `src/components/common/SectionTitle.tsx`         | 필요 시 룰선 옵션 추가 (여러 섹션에서 공용 재사용)                   |

## Risks & dependencies

- 리스트형(AC-4) 레이아웃은 기존 2열 그리드보다 스크롤 길이가 달라질 수 있음 — 시뮬레이터로 실제 길이/가독성 확인 필요.
- Hahmlet 세리프를 더 크게 쓸수록 두 줄 초과 시 줄바꿈 리스크가 커짐 — 이전 작업에서 실제로 겪은 회귀(히어로 타이틀 4줄 wrap)이므로 이번에도 각 AC마다 스크린샷 검증 필수.
- 얇은 룰선 스타일(회색 1px 등)이 `bg-light` 배경에서 대비가 약할 수 있음 — Sam 브리프에서 구체적 색상 지정.

## Open questions (for Manager → user)

- 없음 (AskUserQuestion으로 방향·무드 사전 확정: 구조 재설계 Tier L, 에디토리얼/매거진 스타일)

## Feature breakdown (for Chris)

1. AC-1: 헤더 마스트헤드화
2. AC-2: 히어로 에디토리얼 재설계
3. AC-3: 오늘의 전시 커버스토리화
4. AC-4: 추천 전시 인덱스 리스트화
5. AC-5: KCISA 넘버링
