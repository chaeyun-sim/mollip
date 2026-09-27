---
feature: Android P1 hardening
status: ready-for-user
---

# 사용자 핸드오프

Android P1 정리를 완료했다.

| 기능 | tsc | 테스트 | Android 빌드 | 회귀/예외 |
|---|---|---|---|---|
| Expo SDK 의존성 정렬 | ✅ 0 errors | ✅ 230 passed | ✅ arm64 APK | ✅ expo install check |
| RevenueCat 구매 테스트 정리 | ✅ 0 errors | ✅ 관련 54 tests 포함 전체 통과 | ✅ 네이티브 모듈 포함 빌드 | ✅ unmount/timeout 경로 |
| Android Release 서명 보호 | ✅ 0 errors | ✅ 전체 통과 | ✅ debug APK 빌드 | ⚠️ 실제 EAS release credentials 수동 확인 |

## 사용자 확인 필요

- EAS/Play Console credentials가 release 빌드에 연결되어 있는지 확인
- Android 실기기에서 RevenueCat Play Store 테스트 구매 1회 확인
