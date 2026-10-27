---
feature-slug: korean-first-i18n
author: taylor
status: native-validation-blocked
---
# QA report

## Summary
Tier M. 코드 정적 검사와 자동 테스트 통과. G5는 네이티브 리빌드/실제 UI 검증 차단으로 미통과. 앱 전체 번역 완료가 아님.

## AC matrix
| AC | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf | Q10 native |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 0 errors | 57 suites / 418 tests Pass | 자동 검증 Pass | 실제 UI 미검증 | ESLint 0 errors / 0 warnings | Manual QA Required | hook의 foreground 갱신 자동 검증, 실제 탭 미검증 | 기존 401 tests Pass, 실제 인접 화면 미검증 | 같은 언어 중복 변경 없음 검증 | Pods 버전 불일치로 차단 |

## Exception QA
| 시나리오 / 실행 방법 | 결과 |
| --- | --- |
| 한국어 언어 + US 지역으로 실행 후 sync → 영어 확인. 영어 언어 + KR 지역으로 변경 후 sync → 한국어 확인 | 자동 테스트 Pass |
| 지역 배열 비어 있음: 영어 상태에서 지역 조회가 []를 반환하도록 한 뒤 foreground 갱신 → 한국어 복구 | 자동 테스트 Pass |
| 영어 리소스에 키 누락: 한국어 리소스에만 키 등록 → 영어에서 한국어 fallback 확인 | 자동 테스트 Pass |
| count 0/1/2로 검색 결과·nearest a11y·hero 호출. 두 언어에서 키 노출/치환 누락 없이 올바른 단복수 확인 | 자동 테스트 Pass |
| 한국어 화면 mount → background → 지역 US 변경 → active → 영어, 지역 KR 변경 → active → 한국어. 구독 수 증가 없음, unmount cleanup 확인 | hook 통합 테스트 Pass |
| 통합 실패: 영어 누락 키 → 한국어 fallback → KR 전환 → 이름 삽입 → US 복귀. 마지막 국가 상태와 문구가 일치하는지 확인 | 자동 테스트 Pass |
| 앱 재실행 후 실제 국가/지역 설정 반영, 한국어 지역/영어 지역의 실제 줄바꿈, 설정 복귀, 인접 화면 이동 | Manual QA Required |

번역은 로컬 리소스만 사용하므로 언어 변경 자체의 서버 요청/결제/외부 성공 후 응답 유실 경계는 없다. API 전시 데이터·검색 필터 원본은 그대로 유지한다.

## Evidence
- `evidence/tsc.log` / `evidence/jest.log` / `evidence/eslint.log`
- `evidence/pod-blocker.log`: 마지막 ExpoFileSystem snapshot 불일치.
- `/tmp/mollip-home-i18n.png`를 캡처하고 직접 열어 확인했으나 다른 앱이 표시돼 변경 UI 증빙으로 인정하지 않는다.

## Recommendation
코드 검증 Pass. Pods 정합성 복구 및 rebuild 후 ko/en 실제 화면·인터랙션·인접 화면 회귀가 필요하다. G5/G6 Pass로 처리하지 않는다.
