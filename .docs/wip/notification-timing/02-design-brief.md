---
feature-slug: notification-timing
author: sam
status: draft
---

# Design brief

## Design intent

UI 변경 없음. 기존 알림 센터와 딥링크 데이터 형식을 유지한다.

## Design decisions

- 알림 문구와 카테고리 키는 기존 시스템을 재사용한다.
- 발송은 서버 큐에서 단일화하여 같은 이벤트의 중복 푸시를 방지한다.

## Accessibility

- UI 변경 없음.

## Out of design scope

- 화면, 색상, 타이포그래피, 인터랙션 변경
