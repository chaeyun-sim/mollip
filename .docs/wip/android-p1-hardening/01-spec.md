---
feature: Android P1 hardening
tier: M
status: approved-for-implementation
---

# 범위

Android 운영 빌드의 네이티브 의존성 정합성, RevenueCat 구매 테스트 안정성, Release 서명 설정을 정리한다.

## Acceptance Criteria

### AC-1: Expo 네이티브 의존성 정합성

- Given Expo SDK 56 프로젝트일 때
- When 의존성 검증과 Android Gradle 구성을 실행하면
- Then SDK 57 계열의 Expo 패키지 혼용 경고가 없어지고 네이티브 모듈이 동일한 SDK 계열로 정렬된다.

### AC-2: 구매 테스트 안정성

- Given RevenueCat 구매 timeout 테스트를 실행할 때
- When 비동기 구매 Promise가 테스트 종료 이후 완료되더라도
- Then 테스트가 종료 후 React state update 경고로 실패하지 않고 전체 Jest 스위트가 통과한다.

### AC-3: Android Release 서명

- Given Android release variant를 구성할 때
- When release signing 설정을 평가하면
- Then debug keystore가 운영 release 서명에 사용되지 않으며, EAS/CI가 제공하는 release signing 설정을 사용할 수 있다.

## 범위 밖

- RevenueCat 대시보드 상품·Offering 설정
- 실제 Play Store 결제 및 실기기 구매 검증
- UI 디자인 변경
