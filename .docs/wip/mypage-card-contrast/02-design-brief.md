---
feature-slug: mypage-card-contrast
author: sam
status: pass
---

# Design brief

## Design intent

마이페이지의 첫 카드에 Deep Plum을 사용해 계정 영역을 선명하게 구분한다. 설정 카드는 White를 유지하고 중립 테두리와 그룹 제목으로 읽는 순서를 만든다.

## Tokens

- Canvas `#FAFAF8`, White `#FFFFFF`, Deep Plum `#5F1D3E`, Ink `#2D2D23`
- 카드 테두리: Kimber 12% 투명도. 따뜻한 베이지 면을 늘리지 않는다.
- 프로필 보조 글자: `on-dark` / 브랜드 면. 아바타: `#E3A9C7` / Kimber.
- 그룹 제목: `gray600`, Pretendard semibold 12px. 행 구분선은 중립색.

## Layout & components

| 영역      | 처리                                                       |
| --------- | ---------------------------------------------------------- |
| 프로필    | Deep Plum 배경, 밝은 이름·계정 설명·화살표, 동일 터치 영역 |
| 설정 카드 | White 배경과 중립색 1px 경계, 기존 반경·패딩 유지          |
| 설정 그룹 | 계정 관리·해설·서비스·앱 정보 제목을 카드 위에 배치        |

## States

비로그인 상태에는 프로필 카드가 없다. 잠긴 해설 설정 카드는 현재 비활성 표시를 유지한다. 눌림 상태와 이동 경로는 유지한다.

## Accessibility

White/Deep Plum은 12.13:1, 밝은 보조 글자/Deep Plum도 일반 텍스트 기준을 충족하도록 확인한다. 기존 `accessibilityRole`·`accessibilityLabel`을 유지하고 행 터치 높이 64pt를 유지한다.

## Prototype scope

시뮬레이터에서 마이페이지 전체 캡처, 탭 이동·설정 행 진입 1회 이상, 인접 화면 회귀 확인.

## Out of design scope

탭바, 다른 화면의 카드 일괄 재디자인.
