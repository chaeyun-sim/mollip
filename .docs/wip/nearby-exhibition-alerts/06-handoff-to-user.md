---
feature-slug: nearby-exhibition-alerts
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

근처 전시 알림을 권한 안내부터 기기 내 지오펜싱, 빈도 제한, 알림 탭 지도 이동까지 구현했습니다. iOS 시뮬레이터 빌드와 설정 화면의 켜기 전 안내 흐름을 확인했습니다. 실제 장소 진입으로 알림이 뜨는 동작과 Android 백그라운드 동작은 실기기 QA가 남아 있습니다.

## What changed

- 알림 설정에서 근처 전시 알림을 직접 켜고 끄며, 알림 및 위치 권한 요청 전에 사용 목적과 기기 내 처리 방식을 안내합니다.
- 현재 진행 중이고 좌표가 있는 전시관 중 가까운 최대 20곳을 기기에서 모니터링합니다. 반경 800m 안의 여러 전시는 한 알림으로 묶어 대표 제목과 개수를 표시합니다.
- 알림은 하루 최대 1회, 7일 동안 최대 2회로 제한하며, 같은 전시는 14일 동안 다시 알리지 않습니다. 최근 1시간 안에 앱을 사용했다면 생략합니다.
- 알림을 누르면 해당 장소를 중심으로 지도 탭을 엽니다. 로그아웃·사용자 해제 시 모니터링을 중단합니다.
- Expo Task Manager를 추가하고 iOS 백그라운드 위치 설정을 켰습니다. 네이티브 빌드를 위해 Pod C++ 표준을 C++20으로 맞췄습니다.

## Evidence

| Feature / AC                     | tsc         | Screenshot                                                                      | Interaction                                         | Regression                                           |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| 알림 권한 사전 안내 / AC-1, AC-7 | ✅ 0 errors | [설정 화면](evidence/settings.png), [권한 안내](evidence/permission-prompt.png) | ✅ Maestro 열기 → 탭 → 안내 확인 → 취소 → 꺼짐 확인 | ✅ 라우트로 설정 진입 및 앱 렌더 확인                |
| 지역 등록·빈도 제한 / AC-2~5     | ✅ 0 errors | 정책 테스트 증빙                                                                | ✅ Jest 정책 단위 테스트                            | ✅ 전체 Jest 50 suites / 381 tests 통과              |
| 알림 탭 지도 이동 / AC-6         | ✅ 0 errors | N/A                                                                             | 코드 검토 완료, 실제 알림 탭은 미검증               | 지도 이동은 실기기 알림 수신 시 확인 필요            |
| 네이티브 구성                    | ✅ 0 errors | iPhone 17 Pro simulator                                                         | ✅ iOS 네이티브 빌드 성공                           | ✅ Expo Location / Notifications / Task Manager 로드 |

## Design QA

- Alex (Design QA) verdict: Pass @ iteration 1. 권한 사전 안내와 기존 알림 설정 화면 패턴을 기준으로 검토 기록을 남겼습니다.

## Open questions

- 사용자 피드백: 근처 전시 알림 동작을 실기기에서 최종 확인해 주세요. 특히 백그라운드 진입 알림, 같은 장소 재진입 제한, 알림 탭 후 지도 포커스를 확인해야 합니다.
- iOS 시뮬레이터에서 실제 위치 경계 진입은 검증하지 않았습니다. Android 네이티브 빌드도 이 세션에서 실행하지 않았습니다.

## User feedback

### UX feedback

-

### Evidence

-

### Triage

- [ ] Design → Design Agent
- [ ] Dev → Dev Agent
- [ ] Spec → Manager Agent
- [ ] No change required

---

**확인 요청**

기기에서 권한 안내, 주변 전시 도착 알림, 알림을 눌렀을 때 지도 이동을 확인하고 피드백을 주세요. Android의 강제 종료 뒤에는 OS 정책에 따라 앱을 다시 열기 전까지 지오펜싱이 재개되지 않을 수 있습니다.
