---
feature-slug: onboarding-genre-choice
author: sam
status: pass
---

# Design brief

## Design intent

취향을 고르는 즐거움은 유지하면서 빠르게 끝내고 싶은 사용자에게 분명한 대안을 제공한다. 두 선택은 동등한 경로로 보이고, 칩 선택은 부담 없는 한 화면의 작업이다.

## Tokens

- Background: `#F8F6F2`
- Ink: `#1C1917`
- Font: Pretendard
- Chip: 기존 공용 `Chip` 컴포넌트와 선택 상태 컬러 사용

## Layout & components

| 영역          | 설명                                                | 재사용 컴포넌트                      |
| ------------- | --------------------------------------------------- | ------------------------------------ |
| 선택 프롤로그 | 작품 벽 꾸미기와 빠른 장르 선택 CTA를 세로 배치     | `Button`, `OnboardingSkipAction`     |
| 장르 선택     | 정규 장르 칩을 줄바꿈 배치하고 선택 개수 표시       | `Chip`, `Screen`                     |
| 취향 수정 CTA | 벽 저장 옆에 취향 강화 버튼을 두고 칩 페이지로 이동 | `OnboardingGalleryWall`, `Pressable` |
| 완료          | 하나 이상 선택했을 때 저장 CTA 활성화               | 기존 저장 및 오류 바                 |

## Design decisions

- 벽 꾸미기를 주 경험으로 유지하고, 빠른 선택을 원하는 사용자를 위해 칩 선택 대안을 제공한다.
- 취향 수정의 `취향 강화하기`는 primary로 벽 저장 버튼 오른쪽에 배치하고 현재 선택을 칩 화면에 전달한다. 벽 저장은 보조 스타일로 유지한다.
- 칩은 복수 선택 가능하고 최소 1개를 선택해야 시작할 수 있다.
- 칩 선택 화면의 뒤로 가기는 프롤로그로 돌아가며 선택값은 유지한다.
- 저장된 취향은 기존 추천 페이지와 동일한 실제 장르 일치 근거를 사용한다.

## Copy (KO)

| Element         | Text                                     |
| --------------- | ---------------------------------------- |
| Choice title    | 마음이 머무는 방식으로 취향을 골라보세요 |
| Wall CTA        | 작품을 골라 전시 벽 만들기               |
| Chip CTA        | 장르 칩으로 빠르게 고르기                |
| Picker title    | 어떤 장르의 전시가 끌리나요?             |
| Picker hint     | 좋아하는 장르를 모두 골라주세요          |
| Submit          | 이 취향으로 시작하기                     |
| Preferences CTA | 취향 강화하기                            |

## States

- Empty: 칩 미선택, 완료 CTA 비활성화
- Selected: 선택한 칩 강조 및 개수 표시
- Saving/error: 기존 온보딩 저장 로딩 및 재시도 UI 사용

## Accessibility

- 칩별 `accessibilityRole="button"`, selected state 및 이름 제공
- 완료 CTA 최소 44pt 높이와 비활성 상태 명시

## Prototype scope

- [x] Navigation wired
- [x] Existing profile save wired

## Out of design scope

- 취향 추천 알고리즘과 장르 택소노미 변경
