---
feature-slug: premium-paywall
author: chris
status: implemented-awaiting-visual-qa
---

# Dev notes

## Implemented ACs

| AC   | Status                              | Files                                             |
| ---- | ----------------------------------- | ------------------------------------------------- |
| AC-1 | Implemented, visual QA blocked      | `app/settings/premium.tsx`, settings route/banner |
| AC-2 | Implemented, interaction QA blocked | `app/settings/premium.tsx`                        |

## Implementation decisions

- 결제 상품·자격 미설정 상태에서 구매 버튼을 비활성화했다.
- 주간/월간 자동 갱신과 1일 이용권을 별도 표기했다.
- 사용자 작업 중인 설정 화면의 배너만 프리미엄 화면에 연결했다.

## Changed files

- `app/settings/premium.tsx`
- `app/settings/_layout.tsx`
- `app/(tabs)/settings.tsx`

## Deviations from spec/brief

- None.

## Blockers for Taylor (QA)

- 설치된 iOS 개발 빌드에 `ExpoPushTokenManager`가 없어 앱 시작 실패. `pod install`은 기존 RevenueCat Podfile.lock 18.30.0과 패키지 19.0.0 충돌 및 iOS 배포 최소 버전 문제로 실패. 프리미엄 화면 자체의 런타임·시각 QA 불가.

## Native / env notes

- 이 기능은 네이티브 모듈을 추가하지 않았다. 현재 작업 트리의 기존 `expo-notifications`, `react-native-purchases-ui` 변경이 빌드와 충돌한다.
