---
feature-slug: compact-personalized-card
author: taylor
status: blocked
---

# QA report

| AC   | tsc            | 테스트                                                                                                  | 스크린샷                                                                 | 인터랙션 | 회귀   |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------ |
| AC-1 | Pass, 0 errors | 전체 52개 중 51개 통과. `usePreferences.test.tsx` 한 테스트가 전체 실행에서 실패하고 단독 실행에서 통과 | 캡처 후 확인. 앱이 `ExpoPushTokenManager` 네이티브 모듈 오류 화면에 멈춤 | 미검증   | 미검증 |

## Exception QA

- 추천 이유가 없으면 기존 대체 문구를 표시한다. 스크린 리더 라벨에는 잘리지 않은 전시 제목·장소·상태·추천 이유가 포함된다.
- 긴 제목은 두 줄로 제한한다. 여러 취향이 일치하면 모든 태그를 중복 없이 쉼표로 구분해 표시한다. 실제 화면에서 줄바꿈·동작 검증은 네이티브 모듈 오류로 미검증이다.
- AC-2: `preferredTaste.test.ts` 5개 테스트 통과. 장르 외 취향의 복수 매칭과 미일치 항목 제외를 확인했다.
- 네이티브 앱이 홈에 진입하지 못하므로 카드 탭, 스크롤, 복귀 및 인접 화면은 Manual QA Required.

## Blocking environment issue

부팅된 시뮬레이터의 현재 앱에서 `Cannot find native module 'ExpoPushTokenManager'` 오류가 발생했다. 화면 캡처 `/private/tmp/mollip-compact-card-check.png`를 열어 직접 확인했다. 이번 카드 변경에는 네이티브 모듈을 추가·제거하지 않았다.
