---
feature: Android P1 hardening
status: pass-with-manual-qa
---

# QA 보고서

| 항목 | 결과 | 증빙 |
|---|---|---|
| TypeScript | ✅ | `npx tsc --noEmit` 오류 0건 |
| Jest | ✅ | 26 suites / 230 tests passed, exit code 0 |
| Expo 의존성 | ✅ | `npx expo install --check` → Dependencies are up to date |
| Android debug 빌드 | ✅ | `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a` → BUILD SUCCESSFUL |
| Android APK | ✅ | `android/app/build/outputs/apk/debug/app-debug.apk` 생성 확인 |
| Android 실기기 UX | 미검증 | 실기기 설치·화면·결제는 Manual QA Required |
| Play Store release 서명 | 미검증 | 실제 EAS credentials 연결 필요 |

## Exception QA

- 화면 unmount 중 offerings timeout과 purchase timeout이 남아 React state update를 수행하는 경로를 테스트했다.
- 저장 표식 대기 중 화면이 사라지는 구매 경로를 재검증했고 SDK가 호출되지 않음을 확인했다.
- 오래된 worktree 테스트가 전체 Jest에 섞이는 회귀 경계를 제외 설정으로 고정했다.
- Jest의 남은 open handle은 Sentry JS 라이브러리의 `AsyncExpiringMap` interval이며 테스트 실패로 이어지지 않는다.
