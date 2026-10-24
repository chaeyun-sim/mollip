---
feature-slug: notification-permission-notice
tier: M
author: john
status: draft
---

# Spec — 알림 권한 꺼짐 안내

## Problem

사용자가 OS 알림 권한을 끈 상태에서도 알림함에 푸시 알림을 받을 수 없는 이유와 해결 방법이 보이지 않는다.

## Goals

- OS 알림 권한이 꺼져 있으면 알림함에서 상태와 해결 행동을 안내한다.
- 앱 설정으로 이동한 뒤 알림함에 돌아오면 권한 상태를 갱신한다.

## Constraints

- 기존 알림 목록과 알림 설정 화면 동작을 유지한다.
- 푸시 알림 권한은 앱 설정에서 변경할 수 있도록 안내한다.

## Non-goals (out of scope)

- 앱 내 알림 종류별 설정 변경
- 푸시 토큰 등록 방식 변경

## Users & context

알림함을 방문했지만 기기 설정에서 앱 알림을 비활성화한 사용자.

## Acceptance criteria

### AC-1: 권한 꺼짐 안내

- **Given** 기기의 앱 알림 권한이 꺼져 있음
- **When** 사용자가 알림함을 열거나 다시 포커스함
- **Then** 알림 수신이 꺼져 있음을 알리는 안내와 설정 이동 버튼이 표시됨

### AC-2: 설정 이동 및 상태 갱신

- **Given** 권한 꺼짐 안내가 표시됨
- **When** 사용자가 알림 켜기 버튼을 누르고 설정에서 권한을 변경한 뒤 돌아옴
- **Then** 앱 설정이 열리고, 알림함은 최신 권한 상태를 반영함

## Screens / routes

| Route                       | 변경                                                    |
| --------------------------- | ------------------------------------------------------- |
| `/notifications`            | 권한 허용 시 알림 목록 표시, 꺼짐 시 안내 화면으로 이동 |
| `/notifications/permission` | 권한 꺼짐 안내와 OS 설정 이동                           |

## Risks & dependencies

- 시스템 알림 권한 상태는 앱 foreground 복귀 시 재조회해야 한다.

## Open questions (for Manager → user)

- [x] 없음

## Feature breakdown (for Chris)

1. AC-1 OS 권한 상태 조회와 알림함 안내 UI
2. AC-2 OS 설정 열기와 화면 재진입 시 상태 갱신
