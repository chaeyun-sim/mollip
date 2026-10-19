---
feature-slug: for-you-recommendations
author: sam
status: pass
---

# Design brief

## Design intent

홈에서는 취향 추천을 전시 추천과 같은 포스터 그리드로 짧게 미리 보여준다. 전용 페이지에서는 한 전시씩 크게 보여주고 실제 장르 매칭 이유를 붙여 큐레이션을 읽으며 탐색하게 한다.

## Tokens (defaults)

- Background: `#F8F6F2` / `#F2EFE9`
- Ink: `#1C1917`
- Muted: `#A8A29E` / `#57534E`
- Font: Pretendard (UI), Hahmlet (display)
- Radius: 카드 ~18–24, pills full

## Layout & components

| 영역        | 설명                                                                    | 재사용 컴포넌트                                        |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 홈 미리보기 | 제목·설명, 최대 2개 정사각 포스터 카드, 우측 `더 보기` 텍스트 액션      | `HomeSectionHeader`, `ImageFallback`, `ScalePressable` |
| 전체 페이지 | 공통 헤더와 세로 큐레이션 카드, 큰 포스터·제목·장소·상태·장르 매칭 이유 | `Screen`, `ImageFallback`, `ScalePressable`            |
| 빈 상태     | 취향/매칭 결과 없음 안내 및 홈 복귀                                     | `Result` 또는 도메인 빈 상태                           |

## Design decisions

- 홈 미리보기 카드 수는 1개면 1열 폭, 2개면 2열 그리드로 표시한다.
- 전체 보기 액션은 결과가 2개를 초과할 때만 표시한다.
- 전체 페이지는 현재 저장된 취향 장르 기준을 그대로 사용한다.
- 카드별 설명은 DB `genre`가 사용자의 선호 장르와 일치한다는 사실만으로 구성해 추론을 보태지 않는다.
- 탭 타겟은 최소 44pt, 각 포스터 카드는 접근 가능한 버튼으로 제공한다.

## Copy (KO)

| Element  | Text                                           |
| -------- | ---------------------------------------------- |
| Title    | 취향 저격                                      |
| Subtitle | 좋아하는 장르를 바탕으로 골랐어요              |
| CTA      | 더 보기                                        |
| Reason   | `{장르} 장르를 좋아하는 취향에 맞춰 골랐어요.` |
| Empty    | 아직 취향에 맞는 전시를 찾지 못했어요          |
| Error    | 전시를 불러오지 못했어요 / 다시 시도           |

## States

- Loading: 그리드 크기와 맞는 2개 skeleton
- Empty: 장르 미설정과 매칭 결과 없음 상태를 구분해 안내
- Error: 재시도 버튼
- Success: 홈 최대 2개, 전용 페이지 전체 후보

## Accessibility

- 각 전시 카드는 `accessibilityRole="button"`, 제목·장소·상태를 포함한 라벨.
- `더 보기`는 `accessibilityRole="button"`, `취향 추천 더 보기` 라벨.
- 터치 타겟 ≥ 44pt, 카드 제목 최대 2줄.
- 본문·보조 텍스트는 디자인 시스템의 대비 기준을 따른다.

## Prototype scope

- [x] Navigation wired
- [x] Real recommendation data

## Out of design scope

- 취향 설문 및 장르 분류 편집
