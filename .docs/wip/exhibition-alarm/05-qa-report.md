---
feature-slug: exhibition-alarm
author: taylor
status: pass
---

# QA Report — 전시 마감 알림

## 2026-09-21 재검증 — 회귀 발견 및 수정

최초 QA(정적 검증)는 `[id].tsx`의 `scheduleDeadlineNotifications`/`cancelDeadlineNotifications` 호출부만 보고 Pass 처리했으나, `src/utils/notificationScheduler.ts` 내부의 실제 `Notifications.scheduleNotificationAsync` / `cancelScheduledNotificationAsync` 호출이 **주석 처리되어 있어 알림이 한 번도 예약되지 않는 상태**였다. 또한 트리거가 D-7·D-2 2종뿐이었고(주석은 "D-3"라 적혀 있었으나 실제 값은 2일), spec이 요구하는 D-1("오늘 마지막 날")은 존재하지 않았다.

수정 내용:

- `Notifications` import 및 `scheduleNotificationAsync`/`cancelScheduledNotificationAsync` 호출 주석 해제.
- 트리거를 spec대로 D-7 · D-3 · D-1 3종으로 수정(기존 D-2 → D-3, D-1 신규 추가).
- 네이티브 모듈 미가용 환경(권한 거부 등)에서도 크래시 없이 무시하도록 `try/catch` 추가(`usePushNotifications.ts`와 동일한 방어 패턴).

| AC                    | tsc         | 로직                                                      | 비고                                          |
| --------------------- | ----------- | --------------------------------------------------------- | --------------------------------------------- |
| AC-1 D-7/D-3/D-1 예약 | ✅ 0 errors | 실제 `scheduleNotificationAsync` 호출 확인(재검증)        | 트리거 시각 과거면 자동 스킵 (scheduler 내부) |
| AC-2 취소             | ✅          | 실제 `cancelScheduledNotificationAsync` 호출 확인(재검증) | pushNotificationsEnabled 무관하게 항상 취소   |
| AC-3 알림 비활성화    | ✅          | pushNotificationsEnabled 게이트                           | cancel은 예외 (기존 예약 정리)                |

## 검증 방법

- `npx tsc --noEmit` ✅ 0 errors
- `npm test -- --runInBand` ✅ 26 suites / 252 tests
- 실기기 없이는 iOS 시뮬레이터에서 로컬 알림 권한(`simctl privacy grant notifications`)을 프로그램적으로 부여할 수 없어(지원되지 않는 서비스) 실제 알림 수신 자체는 미확인 — 코드 경로(권한 미부여 시 catch로 조용히 무시)는 소스 검증으로 확인.

## 잔여 리스크

- `usePushNotifications.ts`의 권한 요청(`requestPermissionsAsync`)이 `Device.isDevice` 조건에 걸려 있어, 시뮬레이터에서는 알림 권한 자체가 요청되지 않는다. 실기기에서 첫 로그인 시 권한 프롬프트가 뜨는지 별도 확인 필요(이번 스코프 밖).

## P0 버그 없음 (수정 완료)
