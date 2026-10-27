---
feature-slug: korean-first-i18n
author: manager
status: blocked-before-g6
---
# Handoff status

## Summary
기존 번역 카탈로그와 화면 연결 코드 구현. 기기 국가/지역 KR → 한국어, 그 외 → 영어, 지역 정보 누락/번역 누락 → 한국어. 실제 위치나 스토어 국가는 사용하지 않는다.

## Evidence
| Feature / AC | tsc | Screenshot | Interaction | Regression |
| --- | --- | --- | --- | --- |
| AC-1 지역 기준 번역 연결 | 0 errors | 실제 앱 화면 미검증 | foreground 자동 테스트 Pass / 실제 탭 미검증 | 418 tests Pass / 인접 화면 수동 미검증 |

ESLint 0 errors / 0 warnings. 디자인 검토 4.5/5 Pass. 네이티브 의존성 추가 후 Pods 버전 불일치로 rebuild가 막혀 G5/G6 미통과. 사용자 최종 승인 요청 단계가 아니다.

## Remaining work
- 기존 ExpoModulesWorklets/ExpoLocation/ExpoFileSystem 등 Pods/node_modules 버전 정합성 복구 후 pod install, expo run:ios.
- 한국/해외 지역에서 홈 → 검색 → 상세 → 뒤로 이동, 온보딩/인증/북마크/기록의 실제 ko/en UI와 줄바꿈 검증.
- 카탈로그에 없는 고정 문구의 추후 번역은 `remaining-korean-ui.md` 참조. 정적 검사상 83개 파일의 직접 JSX 한국어 383개. 데이터/동적 문구는 별도 확인 필요.

커밋하지 않음.
