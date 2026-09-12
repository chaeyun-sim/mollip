---
feature-slug: main-hero-visual-boost
author: sam
status: draft
---

# Design brief

## Design intent

- 히어로/오늘의 전시/추천 리드 카드 세 지점의 시각적 임팩트를 순차적으로 강화해, 스크롤 상단에서 시선을 붙잡는다.
- 톤온톤 파스텔 배경은 유지하되, 대비(그라데이션 진하기)와 스케일(이미지 크기)을 키우는 방식으로 "일반적이지만 다양한" 인상을 만든다.
- 새 컴포넌트는 만들지 않는다 — 기존 3개 컴포넌트 내부 스타일만 조정.

## Tokens (defaults)

- Background: `#F8F6F2`(bg-light) / `#F2EFE9`(bg-tonal)
- Ink: `#1C1917`(primary)
- Muted: `#A8A29E`(muted) / `#57534E`(secondary) / `#78716C`(tertiary)
- Font: Pretendard (UI 본문), Hahmlet (타이틀/디스플레이)
- Radius: 카드 22~28

## Layout & components

| 영역 | 설명 | 재사용 컴포넌트 |
|------|------|-----------------|
| 상단 히어로 | 조각상 이미지 96x134로 확대(기존 72x100 → +33%), 그라데이션을 `['#DCC9F0', '#F5F0EB', bg-light]`로 보라 톤 강화, 배지 텍스트 `tracking` 유지, 타이틀은 `text-[36px]`로 소폭 확대(기존 34px) | `ExploreHomeHero` |
| 오늘의 전시 카드 | "오늘의 전시" 라벨을 `rounded-full bg-white/95 px-3 py-1` 배지로 변경(현재는 배지 없는 플레인 텍스트), 타이틀 `text-[28px]`(기존 26px), 그라데이션 마지막 스톱을 `rgba(12,10,9,0.95)`로 소폭 강화 | `FeaturedExhibitionHero` |
| 추천 리드 카드 | 카드 좌상단에 `PICK` 배지(`absolute top-3 left-3`, `rounded-full bg-primary/90 px-2.5 py-1`, 흰색 텍스트 `text-[10px] font-pretendard-bold`) 추가, 그림자 `shadowOpacity` 0.08→0.12로 소폭 강화 | `PosterFrame` 내부 또는 리드 카드 래퍼 |

## Copy (KO)

| Element | Text |
|---------|------|
| 히어로 배지 | ABSORBED IN ART (기존 유지) |
| 히어로 타이틀 | 어떤 이야기를\n담고 있을까요? (기존 유지) |
| 오늘의 전시 배지 | 오늘의 전시 (기존 텍스트 유지, 배지 스타일만 추가) |
| 추천 리드 배지 | PICK |

## States

- Loading: 변경 없음 (`CenteredLoader` 그대로)
- Empty: 변경 없음
- Error: 변경 없음
- Success: 위 3개 컴포넌트 스타일 강화 적용

## Accessibility

- PICK 배지는 장식용 텍스트이므로 리드 카드의 기존 `accessibilityLabel`(`${title}, ${venue}`)에 영향 없음 — 배지 자체에 별도 accessibilityLabel 불필요(시각적 강조 목적).
- 오늘의 전시 배지 대비: 흰 배경(`bg-white/95`) 위 `text-primary`(#1C1917) — 대비 충분(AA 통과 수준).
- 히어로 그라데이션 강화 후에도 텍스트는 `text-primary`/`text-secondary`로 어두운 배경 대비 유지 — 톤 강화가 텍스트 가독성을 해치지 않는지 Taylor 스크린샷 확인 필수.

## Prototype scope

- [x] Static layout only (기존 컴포넌트 스타일 조정, 새 상태/네비게이션 없음)
- [ ] Navigation wired
- [ ] Fake data / stub API

## Out of design scope

- KcisaSection, SectionTitle, FAB 스타일
- 그리드 카드(2열) 스타일
- 신규 아이콘/이미지 에셋 제작 (기존 에셋 재사용)
