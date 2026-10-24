---
feature-slug: main-editorial-redesign
author: sam
status: draft
---

# Design brief

## Design intent

- 매거진 표지·인덱스 관습을 앱 홈에 이식: 마스트헤드(로고+룰선+날짜 eyebrow) → 커버스토리(오늘의 전시) → 인덱스 리스트(추천 전시) → 넘버링된 캐러셀(KCISA).
- pill 배지·둥근 카드 위주였던 "일반적인 앱" 톤을 걷어내고, 얇은 룰선(1px hairline)과 스몰캡스 라벨, 극단적 타이포 크기 대비로 "편집된 지면"의 느낌을 만든다.
- 색은 기존 토큰 그대로 — 새 색을 추가하지 않는다. 대신 여백과 룰선으로 위계를 만든다.

## Tokens (defaults)

- Background: `#F8F6F2`(bg-light)
- Ink: `#1C1917`(primary)
- Rule line: `divider`(`#E7E5E4`, 라이트 배경용) / 이미지 위에서는 `white/40`
- Muted: `#A8A29E`(muted) / `#57534E`(secondary) / `#78716C`(tertiary)
- Font: Hahmlet-bold(대형 헤드라인), Hahmlet-semibold(섹션 타이틀), Pretendard(본문/캡션)
- Eyebrow 공통 스타일: `text-[11px] font-pretendard-semibold tracking-[1.5px] uppercase text-muted`(letterSpacing은 className으로 안 되므로 `style`에 `letterSpacing: 1.5`로 예외 처리)

## Layout & components

| 영역              | 설명                                                                                                                                                                                                                                                                                                                                                                                         | 재사용 컴포넌트                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 마스트헤드(AC-1)  | `mollip` 로고를 `text-[30px] font-hahmlet-bold`로 확대, 바로 아래 `border-b border-divider` 룰선, 그 아래 `오늘 날짜 · EXPLORE` eyebrow 한 줄 추가. 마이페이지 아이콘은 로고와 같은 행 우측 유지                                                                                                                                                                                             | `ScreenHeader`(Logo 슬롯 커스터마이즈)                                 |
| 히어로(AC-2)      | 그라데이션 카드 박스 제거. `bg-light` 배경 위에 좌측 큰 세리프 헤드라인(`text-[44px] font-hahmlet-bold`, 2줄 고정 `\n` 유지), 헤드라인 아래 얇은 룰선 + 캡션. 조각상 이미지는 헤드라인 우측 상단에 절대 위치로 살짝 걸치게(`position: absolute`, 헤드라인 텍스트 폭을 넘지 않는 범위) 배치 — **AC-2 구현 시 반드시 텍스트 wrap 회귀를 스크린샷으로 먼저 확인할 것**(이전 작업에서 겪은 회귀) | `ExploreHomeHero`(전면 재작성)                                         |
| 오늘의 전시(AC-3) | 흰 pill 배지 제거 → `COVER STORY` eyebrow(흰 텍스트, 스몰캡스, 얇은 흰 룰선 4px 아래) + 타이틀 `text-[30px]`(기존 28px보다 확대). 이미지 비율을 `aspect-[3/4]`형태로 세로로 길게(예: height 340px)                                                                                                                                                                                           | `FeaturedExhibitionHero`                                               |
| 추천 전시(AC-4)   | 리드 피처 1개(기존과 유사, 큰 썸네일+타이틀) 유지 + 나머지는 2열 그리드 제거하고 넘버링 리스트로: 각 행 = `01` 인덱스(세리프 볼드, `text-[20px] text-muted`) + 작은 정사각 썸네일(56x56) + 타이틀/장소 텍스트, 행 사이 `border-b border-divider`                                                                                                                                             | `RecommendedExhibitions`(구조 변경), 신규 `IndexListRow` 서브 컴포넌트 |
| KCISA(AC-5)       | 카드 좌상단에 `01` 같은 2자리 인덱스 넘버를 흰 텍스트 + 텍스트 셰도우(또는 반투명 검정 배경 원)로 오버레이                                                                                                                                                                                                                                                                                   | `KcisaExhibitionCard`(넘버 prop 추가), `KcisaSection`(index 전달)      |

## Copy (KO)

| Element               | Text                                                    |
| --------------------- | ------------------------------------------------------- |
| 마스트헤드 eyebrow    | {오늘 날짜(YYYY.MM.DD)} · EXPLORE                       |
| 히어로 헤드라인       | 어떤 이야기를\n담고 있을까요? (기존 유지)               |
| 오늘의 전시 eyebrow   | COVER STORY                                             |
| 추천 전시 섹션 타이틀 | 기존 로직 유지("추천 전시 · 당신의 취향" / "추천 전시") |

## States

- Loading/Empty/Error: 기존 `CenteredLoader`/`RetryErrorState`/빈 텍스트 그대로 재사용 — 이번 스코프는 성공 상태의 레이아웃만 재설계
- Success: 위 5개 영역 전면 재구성

## Accessibility

- 룰선(hairline)은 장식 요소이므로 accessibility 트리에 영향 없음(`pointerEvents="none"` 불필요, 순수 View border)
- 넘버링 리스트 각 행의 `accessibilityLabel`은 기존 그리드 셀과 동일하게 `${title}, ${venue}` 유지, `accessibilityRole="button"` 유지
- KCISA 넘버 배지는 장식용 — 카드 자체의 기존 accessibilityLabel에 영향 없음
- 히어로 이미지가 텍스트 위에 걸치는 절대 위치 배치 시, 텍스트 가독성(대비) 확보 위해 이미지와 텍스트가 실제로 겹치지 않도록 우측 상단 여백 확보(순수 배치 겹침이 아니라 시각적으로 "걸치는" 착시만 사용)

## Prototype scope

- [x] Static layout only (레이아웃/스타일 재구성, 새 네비게이션 없음)
- [ ] Navigation wired (기존 탭/상세 이동 로직 그대로 재사용)
- [ ] Fake data / stub API

## Out of design scope

- FAB 스타일·위치
- 다른 탭 화면
- 데이터 로직/훅
