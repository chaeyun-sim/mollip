---
feature-slug: home-discovery-sections
author: sam
status: approved
---

# Design brief

## Design intent

따뜻한 한국 미술관 에디토리얼. 세 섹션이 서로 다른 리듬을 갖는다: 인기=**목록(컨테이너 행)**, 국립=**갤러리(가로 큰 포스터, 톤 밴드)**, 추천=**그리드(2열)**. 섹션 간격은 절제하고 구분은 면(밴드/컨테이너)과 헤어라인으로.

## Tokens (defaults)

- Background `#F8F6F2`(gray100) / 컨테이너 `#F2EFE9`(gray200) / 갤러리 밴드 `#E5E1D8`(image-placeholder 토큰, 따뜻한 한 단계 진한 톤)
- Ink `gray900`, 보조 `gray700`, 메타 `gray600`, 헤어라인 `border-divider`
- 섹션 제목 `font-hahmlet-bold text-[22px]`, eyebrow/캡션 Pretendard
- Radius: 컨테이너 24, 포스터 8~14

## Layout & components

| 영역      | 설명                                                                                                                                  | 재사용 컴포넌트                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 섹션 헤더 | eyebrow(Pretendard 11) + Hahmlet 22 제목 + 우측 slot                                                                                  | 신규 `home/HomeSectionHeader`                                           |
| 상태 폴백 | 에러(다시 시도)·빈 문구 공통                                                                                                          | 신규 `home/HomeSectionMessage`                                          |
| 인기      | `bg-gray200 rounded-[24px] mx-6`, 행: 포스터 56×76 r8 + 상태 배지 + 제목 2줄 + 장소 1줄 + chevron, 행 사이 inset 헤어라인, 최대 5행   | 신규 `home/PopularCollection`, `ExhibitionStatusBadge`, `ImageFallback` |
| 국립      | 풀블리드 밴드, 포스터 폭 = min(220, (W−48)×0.62) 3:4 r10 + 그림자, 아래 상태·제목(Hahmlet 15 2줄)·장소, 가로 스크롤, 헤더 우측 더보기 | 신규 `home/NationalGallery`                                             |
| 추천      | 폭 = floor((W−48−16)/2) 4:5 r14, 제목 2줄·장소 1줄·상태, 행 gap 24 / 열 gap 16, 홀수는 빈 셀                                          | 신규 `home/RecommendedGrid`                                             |

## Design decisions

- 인기 아바타·번호 제거(익명·근거 없음). 국립 `01/02` 오버레이 제거.
- 밴드는 신규 hex를 만들지 않고 기존 `image-placeholder` 토큰 사용.
- 그리드는 폭을 `useWindowDimensions`로 계산 → 좁은 화면에서 고정 폭 클리핑 없음.
- 공용 카드는 수정하지 않고 home 전용 컴포넌트를 신설.

## Copy (KO)

| Element   | Text                                                                 |
| --------- | -------------------------------------------------------------------- |
| 인기 제목 | eyebrow `POPULAR` · 요즘 인기 있는 전시                              |
| 국립 제목 | eyebrow `NATIONAL MUSEUMS` · 국립 기관 전시 · 더보기                 |
| 추천 제목 | eyebrow `FOR YOU` · `{name}님을 위한 추천` / `추천 전시` (기존 규칙) |
| Empty     | 인기 전시가 없어요 / 진행 중인 전시가 없어요 / 추천할 전시가 없어요  |
| Error     | 전시 정보를 불러오지 못했어요 · 다시 시도                            |
| 장소 없음 | 장소 정보 없음                                                       |

## States

- Loading: 섹션별 스켈레톤(행/포스터/그리드 셀)
- Empty: 문구
- Error: 문구 + 다시 시도(accessibilityLabel `{섹션} 다시 불러오기`)
- Success: 위 레이아웃

## Accessibility

- 모든 카드/행 `accessibilityRole="button"`, label `제목, 장소`(+상태)
- 행 높이 ≥ 76, 더보기 hitSlop 8
- 본문은 gray900/gray700 on gray200·밴드(대비 ≥ 4.5 목표), 메타 gray600

## Prototype scope

- [x] Navigation wired
- [x] 실데이터(기존 훅)

## Out of design scope

- 상단 영역, 다크 모드, 모션
