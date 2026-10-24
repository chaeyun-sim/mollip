---
feature-slug: home-editorial-refresh
author: sam
status: approved
---

# Design brief

## Design intent

- 미술관 도록처럼 차분한 위계: 작은 날짜 eyebrow → 큰 세리프 헤드라인 → 작품 이미지가 지배하는 커버 카드.

## Tokens

- 배경 `bg-bg-light`(#F8F6F2), 잉크 `gray900`, 보조 `gray500/600`, FAB `bg-secondary`(#302D33). 신규 토큰 없음.
- 폰트: Hahmlet-bold(헤드라인·전시명), Pretendard(레이블·본문).

## Layout & components

| 영역            | 설명                                                             | 재사용 컴포넌트                           |
| --------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| 헤더            | 로고 + 북마크·알림, `fullBleed`                                  | `ScreenHeader`                            |
| 탐색 줄         | 검색바(flex-1) + 44pt 지도 버튼                                  | `SearchBar`, `IconButton`                 |
| 에디토리얼 헤드 | `10월 5일 일요일` / `지금 가볼 만한 전시` 26px                   | —                                         |
| 커버 카드       | 폭 = 화면−48, 높이 = 폭×1.18, 라운드 20, 그라데이션 위 흰 텍스트 | `FeaturedExhibitionHero`, `ImageFallback` |
| 위치 표시       | 좌 `01 / 03`, 우 도트(활성 w-5)                                  | —                                         |
| 섹션            | POPULAR / 국립 기관 / FOR YOU                                    | `SectionTitle`, `HorizontalSection`       |
| FAB             | 카메라 아이콘 + "AI 도슨트" 52pt 알약                            | `LoginRequiredPressable`                  |

## Design decisions

- 카테고리 카피("지금 아니면 못 봐요!" 등)는 주인공에서 상단 작은 레이블로 강등, 실제 전시명·장소를 전면에.
- 자동 재생 제거 — 사용자가 읽는 속도를 존중. 위치는 숫자+도트로 이중 표기.
- 아이콘뿐인 FAB을 라벨 FAB으로 — 기능 발견성 확보. 홈 상단 지도 버튼으로 탐색 동선 단축.

## Copy (KO)

| Element       | Text                 |
| ------------- | -------------------- |
| Headline      | 지금 가볼 만한 전시  |
| CTA           | AI 도슨트            |
| 인기          | 요즘 인기 있는 전시  |
| 추천(개인화)  | {이름}님을 위한 추천 |
| Empty / Error | 기존 문구 유지       |

## States

- Loading: 커버 카드 크기의 `bg-image-placeholder` 블록.
- Empty: 캐러셀 숨김.
- Error: 섹션별 기존 재시도 UI.
- Success: 커버 카드 + 위치 표시.

## Accessibility

- 카드 레이블 `전시명, 장소, 상태`. 지도 버튼 "지도에서 전시 찾기"(44pt). FAB 레이블 "AI 도슨트로 작품 해설 만들기" + 힌트. 위치 표시 레이블 "대표 전시 N번째, 총 M개".
- 대비: 이미지 위 텍스트는 하단 0.82 어두운 그라데이션으로 확보(실기기 확인 필요).

## Prototype scope

- [ ] Static layout only
- [x] Navigation wired
- [x] 실제 데이터 사용(스텁 없음)

## Out of design scope

- 인기 아바타 라벨, 다크 모드
