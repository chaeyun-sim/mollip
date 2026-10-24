---
feature-slug: notification-permission-notice
author: sam
status: draft
---

# Design brief

## Design intent

참고 이미지처럼 꺼진 상태와 다음 행동을 한눈에 보여주는 전용 페이지로 표현한다. 이전 알림은 기본 화면에서 감추고, 사용자가 원하면 별도 행동으로 열 수 있게 한다.

## Tokens (defaults)

- Background: `#F8F6F2`
- Ink: `#1C1917`
- Muted: 기존 gray 토큰
- Font: Pretendard (UI), Hahmlet (display)
- Primary action: 기존 `brand` + white

## Layout & components

| 영역      | 설명                                                   | 재사용 컴포넌트                         |
| --------- | ------------------------------------------------------ | --------------------------------------- |
| 권한 안내 | 알림 그래픽, 제목, 짧은 설명, 주요 CTA, 이전 알림 보기 | `View`, `Text`, `Pressable`, `Ionicons` |
| 알림 목록 | 기존 구성 유지                                         | 기존 목록                               |

## Design decisions

- 권한이 꺼진 경우 알림 목록을 기본 화면에서 숨겨 안내에 집중시킨다.
- 기기 외곽선이나 원형 장식 없이 알림 카드 두 장을 헤더 바로 아래에 배치하고, 위 카드부터 순차적으로 나타나게 한다.
- 기존 알림을 잃지 않도록 “이전 알림 보기”로 목록에 진입할 수 있게 한다.
- CTA는 OS 앱 설정을 열어 실제 권한을 바꿀 수 있게 한다.

## Copy (KO)

| Element     | Text                                                              |
| ----------- | ----------------------------------------------------------------- |
| Title       | 전시 소식을 놓치지 마세요                                         |
| Description | 푸시 알림을 켜면 찜한 전시 마감과 새로운 소식을 받아볼 수 있어요. |
| CTA         | 알림 켜기                                                         |
| Secondary   | 나중에                                                            |

## States

- Loading: 권한 상태 확인 중에는 안내 카드 숨김
- Empty: 기존 빈 알림 문구 유지, 권한 안내가 위에 표시됨
- Error: 권한 조회 실패 시 안내 숨김
- Success: 권한이 허용되면 안내 숨김

## Accessibility

- CTA는 button role, “기기 알림 설정 열기” label 제공
- CTA 높이 44pt 이상
- 브랜드 배경과 흰 텍스트의 기존 대비 사용

## Prototype scope

- [x] Navigation wired
- [ ] Fake data / stub API

## Out of design scope

- 알림 종류별 앱 내 설정
