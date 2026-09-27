---
feature: Android P1 hardening
status: implemented
---

# 구현 기록

- Expo SDK 56 기준으로 `@react-native-community/datetimepicker`, `expo-build-properties`, `expo-device`, `expo-notifications` 버전을 정렬했다.
- Jest가 `.claude/worktrees`의 복제 테스트를 수집하지 않도록 제외했다.
- `usePremiumPurchase`의 offerings/purchase timeout을 unmount 시 정리하고 테스트 루트도 매 테스트 후 unmount하도록 했다.
- Android release가 debug keystore를 재사용하지 않도록 수정했다. EAS/CI는 `MYAPP_UPLOAD_*` Gradle 속성 또는 `MOLLIP_RELEASE_*` 환경변수로 release keystore를 주입할 수 있다.

## 의도적으로 남긴 수동 확인

- Play Console용 실제 release keystore와 EAS credentials 연결은 외부 계정 설정이므로 로컬에서 검증하지 않았다.
- 실제 Play Store Sandbox 구매는 수동 QA가 필요하다.
