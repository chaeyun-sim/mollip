---
feature-slug: korean-first-i18n
author: chris
status: implemented-native-validation-blocked
---
# Dev notes

## AC-1
- `src/i18n/index.ts`: 한국어 정본·영어 번역 등록, 한국어 fallback, 동기 초기화.
- `src/i18n/language.ts`: getLocales 첫 locale의 languageCode가 ko → ko, 다른 언어 → en, 언어 코드 누락 → ko. 지역 코드는 선택에 사용하지 않는다.
- `useSyncDeviceLanguage`: foreground에서 최신 지역을 재조회, 같은 언어이면 중복 changeLanguage 생략, unmount 시 listener 해제.
- 기존 카탈로그에 대응하는 고정 UI·접근성 문구 연결. 홈·추천·마감 안내·탭·검색·인증·온보딩·전시·설정·기록·공통 컴포넌트. 카탈로그의 사용자 편집 문구 보존.
- 마감 안내·검색 결과는 기본 키 + count 호출, `_one`/`_other` 자동 선택. 삭제한 중복 기본 키는 추가하지 않음.
- React callback/memo의 t 의존성 반영. 데이터 필터링에 쓰는 장르·작가·검색어 원본은 변경하지 않고 표시만 번역.
- 추가된 home.featured와 recommendations.labels는 기존 한국어 상수에 대응하는 표시 문구다. 한국어 먼저 등록 후 영어 번역.
- app.config: 지원 언어 ko/en, iOS 개발 기본 지역 ko. expo-localization 네이티브 의존성 추가로 rebuild 필요.
- 정적 검사로 찾은 미연결 JSX 한국어는 `remaining-korean-ui.md` 참조. 템플릿·상수 배열·유틸의 동적 문구는 이 목록 외에도 존재할 수 있다.

## Native blocker
pod install → ExpoModulesWorklets 불일치. targeted update → ExpoLocation, 두 모듈 targeted update → ExpoFileSystem 불일치. 기존 Pods와 node_modules의 다수 Expo 버전이 맞지 않는다. 무관한 네이티브 패키지 전체 업데이트로 확대하지 않았다. pod install 미통과로 expo run:ios 리빌드는 진행하지 못함.
