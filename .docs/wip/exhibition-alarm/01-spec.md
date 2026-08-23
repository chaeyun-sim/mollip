---
feature-slug: exhibition-alarm
tier: M
author: john
status: draft
---

# Spec — 전시 마감 알림

## Problem

- `notificationScheduler.ts`(D-7/D-3 로직)와 `bookmarkStore.toggle`이 연결되지 않아 알림이 한 번도 발송되지 않음
- D-1 "오늘 마지막 날" 트리거도 없음
- 설정의 푸시 알림 토글(`pushNotificationsEnabled`)이 로컬 예약 알림에는 영향을 주지 않음

## Goals

- 북마크 추가 시 D-7 · D-3 · D-1 로컬 알림 자동 예약
- 북마크 제거 시 예약된 알림 일괄 취소
- `pushNotificationsEnabled = false`이면 예약하지 않음

## Non-goals

- 알림 탭 시 전시 상세 딥링크 (별도 작업)
- 서버 사이드 push (Expo Push API) — 마감 알림은 로컬로 충분
- 다른 북마크 toggle 호출부(검색 결과 카드 등) — endDate 없어 스킵

## Acceptance criteria

### AC-1: D-7 · D-3 · D-1 알림 예약

- **Given** 푸시 알림이 허용된 상태에서 전시 상세 화면에서 북마크를 추가한다
- **When** `endDate`가 유효하고 각 트리거 시각이 미래일 때
- **Then** D-7 · D-3 · D-1 오전 10시에 로컬 알림이 예약된다

### AC-2: 북마크 제거 시 알림 취소

- **Given** 북마크가 추가된 전시
- **When** 전시 상세에서 북마크를 해제한다
- **Then** 해당 전시의 예약된 알림이 모두 취소된다

### AC-3: 푸시 알림 비활성화 시 예약 안 함

- **Given** 설정에서 푸시 알림이 꺼져 있다 (`pushNotificationsEnabled = false`)
- **When** 전시를 북마크한다
- **Then** 로컬 알림이 예약되지 않는다

## Screens / routes

| 파일 | 변경 |
|------|------|
| `src/utils/notificationScheduler.ts` | D-1 트리거 추가 |
| `app/(explore)/[id].tsx` | onBookmark 핸들러에 schedule/cancel 연결 |

## Feature breakdown (for Chris)

1. AC-1 / D-1: `notificationScheduler.ts`에 `{ daysLeft: 1, body: '북마크한 전시가 오늘 마지막이에요' }` 트리거 추가
2. AC-1 / AC-2 / AC-3: `[id].tsx` onBookmark 핸들러에서 `willAdd` 판단 후 schedule/cancel 호출 + `pushNotificationsEnabled` 게이트
