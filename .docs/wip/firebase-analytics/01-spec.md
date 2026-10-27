---
feature-slug: firebase-analytics
tier: M
author: john
status: pass
---
# Spec — iOS Firebase Analytics 연결

## Problem / Goals
설정 파일은 제공됐으나 Analytics SDK와 이벤트 연결이 없다. BUNDLE_ID com.simune.mollip 일치 확인. 사용자의 기존 미커밋 i18n/앱 이름 작업 보존.

## Constraints
iOS 우선. Android 파일 미제공으로 Android 수집 비활성. SDK 실패가 핵심 앱 동작을 막지 않는다. 이메일·검색어 원문·사진·작품 입력 내용·실제 route parameter 전송 금지. 광고 ID 사용 안 함. 개발/preview 기본 수집 끔, 명시적 디버그 opt-in 허용. production 수집 켬.

## Non-goals
Android 설정, 광고/리마케팅, Firebase Auth로 전환, 결제 매출 이벤트, 새 동의/설정 화면, Firebase 콘솔 계정 설정 변경.

## Acceptance criteria
### AC-1: Analytics 연결과 안전한 이벤트 수집
- **Given** 현재 iOS 앱 ID와 일치하는 GoogleService-Info.plist가 있을 때
- **When** 생산 빌드(또는 명시적으로 디버그 수집을 켠 빌드)에서 화면 이동·전시 선택·검색 제출·로그인 성공을 수행하면
- **Then** SDK 초기화 및 이벤트 호출이 이루어지고, 화면명은 route template만 사용하며, 중복 초기화나 SDK 실패로 사용자 동작이 막히지 않는다. 개발 기본·미설정 플랫폼에서는 수집하지 않는다.

## Risks & dependencies
RNFirebase 네이티브 설치/리빌드 필요. 기존 Pods 불일치가 확인된 환경이므로 실제 DebugView 수신은 수동 검증으로 구분한다. 제공 plist IS_ANALYTICS_ENABLED=false이므로 Firebase 콘솔에서 GA 연결 상태는 파일만으로 확정하지 않는다.

## Open questions
없음. iOS 연결을 우선 진행한다.
