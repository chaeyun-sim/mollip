---
feature-slug: manual-record-redesign
author: Codex (Taylor role, self-verification)
status: verified-with-limitations
---

# QA report

## Summary

최종 범위는 사용자가 제공한 포스터 중심 레이아웃 + 단일 방문일. iPhone 17 Pro / iOS 26.5에서 직접 검증. 확인된 변경 관련 P0/P1 없음.

## AC matrix

| AC             | Q1 tsc | Q2 jest                      | Q3 기능             | Q4 UX                 | Q5 컨벤션   | Q6 화면                    | Q7 동작                    | Q8 회귀                  | Q9 성능                              |
| -------------- | ------ | ---------------------------- | ------------------- | --------------------- | ----------- | -------------------------- | -------------------------- | ------------------------ | ------------------------------------ |
| AC-1 방문일 폼 | 오류 0 | 앱 41 suites, 307 tests 통과 | 단일 날짜 전달 확인 | 스크롤/선택 해제 확인 | eslint 통과 | 선택 전후 이미지 열어 확인 | 선택→해제→과거일→제출 통과 | 검색→직접 입력→기록 화면 | 추가 네트워크/리스너 없음(코드 검토) |

Q10: 네이티브 모듈 변경 없음.

## Evidence

- `evidence/visit-date-selected.png`: 2026.10.12 선택 상태, 실제 simctl 캡처 후 열어 확인.
- `evidence/visit-date-yesterday.png`: 2026.10.11 선택, 화면 확인.
- `evidence/visit-date-submitted.png`: 다음 화면 탑승권과 방문일 모두 10.11, 제목 전달 확인.
- `evidence/visit-date-commands.json`: Maestro 최종 시나리오 전부 성공.
- `evidence/tsc.log`, `evidence/jest.log`: 타입/앱 테스트 결과.

## Exception QA

| 시나리오                                                         | 결과                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 날짜 선택→다시 열기→날짜 선택 해제→재선택→하루 전 날짜 확정→제출 | Pass. 해제 시 ‘방문일 선택’, 이후 10.11 전달. 통합 복구 시나리오                           |
| 미선택 제출 시 오늘 기본값                                       | 코드 검토: undefined 전달, write의 기존 default 적용. 최종 레이아웃에서 직접 실행은 미검증 |
| 미래일 선택                                                      | maximumDate로 오늘 제한, 코드 확인. 휠 강제 조작은 미검증                                  |
| 자정/시간대 변경 중 열린 모달                                    | Manual QA Required                                                                         |
| 사진 권한 거부/백그라운드 복귀/작은 기기·큰 글자                 | 최종 레이아웃에서 Manual QA Required                                                       |

## Findings / limitations

- 전체 `npm test`는 앱 외 `.agents/skills/claude-to-im` 11 suites가 모듈 해석 오류로 실패. 해당 경로를 제외하면 41 suites/307 tests 통과. 설정/스킬 수정 없음.
- 기존 공통 DatePickerModal의 접근성 트리에서 확인 버튼이 부모와 묶여 정확한 텍스트 선택에 실패하여 시각 확인 후 좌표로 조작했다. 공통 모달 VoiceOver 검증은 별도 필요.
- 일부 초기 실행은 앱 재시작 또는 Maestro 절대 캡처 경로 거부로 중단. 재진입하고 허용된 상대 캡처 경로로 최종 시나리오 통과.
- 포스터 중심 레이아웃은 사용자가 직접 제공한 형태를 유지했다. 이전 prototype/keyboard/empty-disabled 증거는 이전 디자인용이며 최종 검증에 포함하지 않는다.
- 최종 기록 저장/서버 업로드는 이번 폼 범위 밖으로 실행하지 않음.

## Recommendation

핵심 방문일 변경 확인 완료. 위 미검증 항목을 명시하여 사용자 핸드오프.
