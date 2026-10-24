---
feature-slug: notification-timing
tier: L
author: john
status: draft
---

# Spec — 알림 발송 시점 정리

## Problem

알림 토큰은 저장되지만 발송 트리거와 실제 요구 시점이 달라 알림이 누락되거나 늦게 발송된다.

## Goals

- 공지는 등록 2분 후 발송한다.
- 추천 전시는 3일 간격으로 오전 11:30에 발송한다.
- 팔로우 전시관 신규 전시는 등록 10분 후 발송한다.
- 관람 종료 시 리뷰 유도 알림을 발송한다.
- 찜한 전시 마감 알림은 서버 D-1 발송으로 통일하고 로컬 중복 예약은 새로 만들지 않는다.

## Constraints

- Expo Push API와 `notification_logs`를 기존 공통 발송기로 사용한다.
- 예약 작업은 Supabase DB 큐와 Edge Function으로 처리한다.
- service role key는 클라이언트와 저장소에 넣지 않는다.

## Non-goals (out of scope)

- 알림 화면 UI 개편
- 푸시 제공업체 교체
- 알림 문구의 전면 개편

## Acceptance criteria

### AC-1: 지연 큐

- **Given** 공지 또는 신규 전시가 등록된다
- **When** 각각 2분 또는 10분이 지난다
- **Then** 대상 사용자에게 한 번만 푸시하고 `notification_logs`에 기록한다.

### AC-2: 관람 종료 알림

- **Given** 로그인 사용자의 관람 기록이 종료된다
- **When** 종료 시각이 원격 visits에 저장된다
- **Then** 리뷰 유도 알림을 즉시 한 번 발송한다.

### AC-3: 추천 주기

- **Given** 추천 발송 기록이 최근 3일 이내에 없다
- **When** 매일 오전 11:30 큐 함수가 실행된다
- **Then** 추천 알림을 발송하고, 최근 3일 이내 기록이 있으면 건너뛴다.

### AC-4: 중복 방지

- **Given** 동일 이벤트가 재시도된다
- **When** 같은 dedupe key로 큐에 들어온다
- **Then** 하나의 작업만 처리한다.

## Screens / routes

| Route | 변경                      |
| ----- | ------------------------- |
| 없음  | 백엔드·관람 동기화만 변경 |

## Risks & dependencies

- `notification_jobs` 처리 cron과 각 Edge Function 배포가 필요하다.
- 기존 `send-visit-reminders`, `send-venue-follow-new-exhibition` cron은 중지해야 한다.

## Open questions (for Manager → user)

- [x] 추천 주기: 3일 간격, 11:30 KST
- [x] 마감 알림: 서버 D-1 유지

## Feature breakdown (for Chris)

1. notification_jobs migration 및 visits 종료 시각 컬럼 추가
2. 지연 큐 처리 Edge Function 추가
3. 공지·신규 전시 큐 생성 및 관람 종료 동기화
4. 로컬 마감 알림 신규 예약 제거
