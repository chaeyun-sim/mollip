# Firebase Analytics 이벤트와 검증

## 설정

- `GoogleService-Info.plist`의 BUNDLE_ID와 Expo iOS bundleIdentifier: `com.simune.mollip`.
- `@react-native-firebase/app`, `@react-native-firebase/analytics`는 Node 22와 호환되는 26.0.0으로 고정한다. 이 버전은 Firebase JS/iOS SDK 12.15.0을 사용한다.
- iOS는 static frameworks와 `$RNFirebaseAsStaticFramework = true`를 사용한다.
- 광고 ID와 광고 저장/개인화는 비활성화한다. 자동 네이티브 screen reporting은 끄고 Expo Router template 화면명만 기록한다.
- Android의 google-services.json은 아직 없다. Android plugin mod와 RNFirebase autolinking, JS 수집을 제외했다. 향후 Android를 연결할 때 설정 파일·플러그인·autolinking·플랫폼 가드를 함께 수정한다.

## 수집 정책

| 빌드 | 기본 수집 |
| --- | --- |
| 로컬 / development / preview | 끔 |
| production | 켬 |
| EXPO_PUBLIC_ANALYTICS_DEBUG=true로 만든 개발 빌드 | 켬 (검증용 opt-in) |

기본 collection은 firebase.json에서 false. development/preview native Info.plist의 FIREBASE_ANALYTICS_COLLECTION_DEACTIVATED=true로 이전 production 설치에서 남은 수집 설정도 차단한다. production/명시적 debug 빌드만 JS에서 활성화한다. 앱 이름은 기존 정책대로 development/preview `몰립 개발`, production `몰립`.

## 이벤트

| 이벤트 | 발생 위치 | 전송 값 |
| --- | --- | --- |
| screen_view | 부트 완료 후 화면 전환 | screen_name(route template), screen_class=ExpoRouter |
| select_content | 홈/검색에서 전시 선택 | content_type=exhibition, item_id |
| search_submitted | 검색어를 직접 제출 | query_length (검색어 원문 제외) |
| login | Apple/Kakao 로그인 성공 | method=apple/kakao |

이메일·사진·입력한 작품 설명·검색어·실제 route parameter·인증 토큰·서버 오류 내용은 이벤트에 전달하지 않는다. 구매/매출 이벤트는 이번 범위에 없다.

## DebugView 수동 검증

1. `EXPO_PUBLIC_ANALYTICS_DEBUG=true npx expo prebuild --platform ios --no-install`로 수집을 허용하는 개발 native config를 생성한다. 단순 JS 리로드로 Info.plist 설정은 바뀌지 않는다.
2. `cd ios && pod install` 후 `EXPO_PUBLIC_ANALYTICS_DEBUG=true npx expo run:ios`로 새 native build를 설치한다.
3. 시뮬레이터에서는 `xcrun simctl launch --terminate-running-process booted com.simune.mollip -FIRDebugEnabled`로 Firebase 디버그 로그를 켠다. 실제 디바이스는 Xcode scheme Arguments Passed On Launch에 `-FIRDebugEnabled`를 지정한다.
4. Firebase 콘솔의 Analytics → DebugView에서 기기를 고르고 홈 → 검색 → 전시 상세 → 뒤로 이동한다. 로그인은 실제 인증 성공 시에만 login 이벤트가 기록되는지 확인한다.
5. Firebase 콘솔에서 프로젝트의 Google Analytics 연결도 확인한다. 앱의 SDK 로깅/업로드 로그와 실제 콘솔 수신은 별도 증빙이다. 콘솔 접근이 없으면 수신을 Pass로 기록하지 않는다.
6. 일반 개발 빌드로 돌아갈 때 debug 환경변수를 제거한 상태로 prebuild/rebuild한다. production/preview도 각 EAS profile의 환경변수를 사용해 native project를 생성한다.

공식 참고: https://rnfirebase.io/analytics/usage , https://rnfirebase.io/analytics/screen-tracking
