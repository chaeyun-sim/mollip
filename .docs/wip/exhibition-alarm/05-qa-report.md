---
feature-slug: exhibition-alarm
author: taylor
status: pass
---

# QA Report — 전시 마감 알림

| AC | tsc | 로직 | 비고 |
|----|-----|------|------|
| AC-1 D-7/D-3/D-1 예약 | ✅ 0 errors | willAdd 판단 + schedule 호출 정상 | 트리거 시각 과거면 자동 스킵 (scheduler 내부) |
| AC-2 취소 | ✅ | cancelDeadlineNotifications 호출 | pushNotificationsEnabled 무관하게 항상 취소 |
| AC-3 알림 비활성화 | ✅ | pushNotificationsEnabled 게이트 | cancel은 예외 (기존 예약 정리) |

## 시뮬레이터 미실행
로컬 알림은 실기기에서만 동작 (Device.isDevice 조건). 정적 검증으로 대체.

## P0 버그 없음
