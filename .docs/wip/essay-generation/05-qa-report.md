---
feature-slug: essay-generation
author: taylor
revision: 2
status: draft
---

# QA report — 감상평 통합 (rev2)

## Summary

- P0: 0건
- Tier: M
- Date: 2026-09-12
- Verdict: **Pass(조건부)** — Q1/Q2/Q3/Q5/Q8/Q9/Q10은 통과. Q6/Q7(시뮬레이터 비주얼·인터랙션)은 앱 바이너리가 어떤 시뮬레이터에도 설치되어 있지 않고 `ios/` 프리빌드도 없어 실기 확인이 불가했다. 코드 결함이 아니라 환경 차단이다.

## AC matrix

| AC                         | Q1 tsc | Q2 jest           | Q3 bug                   | Q4 UX                         | Q5 conv | Q6 visual | Q7 interact | Q8 regress          | Q9 perf |
| -------------------------- | ------ | ----------------- | ------------------------ | ----------------------------- | ------- | --------- | ----------- | ------------------- | ------- |
| AC-1 감상평 단일 입력칸    | ✅     | N/A               | ✅                       | ✅ 카피 일치                  | ✅      | ⚠️ 미완   | ⚠️ 미완     | ✅                  | ✅      |
| AC-2 작성 방식 토글        | ✅     | N/A               | ✅                       | ✅                            | ✅      | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-3 별점만으로 생성       | ✅     | ✅ essayPrompt    | ✅ 가드 없음             | ✅                            | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-4 기존 텍스트 재료 포함 | ✅     | ✅ essayPrompt    | ✅                       | —                             | —       | —         | ⚠️ 미완     | —                   | —       |
| AC-5 생성 중 잠금          | ✅     | N/A               | ✅ stage 단일 소스       | ✅                            | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-6 TextInput 스트리밍    | ✅     | N/A               | ✅ 동기화 effect         | —                             | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-7 완료 후 편집          | ✅     | N/A               | ✅ done 이후 로컬 state  | ✅                            | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-8 빈 감상평으로 다음    | ✅     | N/A               | ✅ 텍스트 필수 조건 없음 | ✅                            | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-9 해설 없이 생성        | ✅     | ✅ essayPrompt    | ✅                       | —                             | —       | —         | —           | —                   | —       |
| AC-10 생성 실패            | ✅     | N/A               | ✅ clearError + 재시도   | ✅ 카피 2종                   | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-11 다음 → 서명          | ✅     | N/A               | ✅ onEssayNext만         | ✅ 키보드 완료 미구현(브리프) | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-12 생성 중 다음 차단    | ✅     | N/A               | ✅ 양쪽 가드             | ✅                            | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |
| AC-13 이탈 시 취소         | ✅     | N/A               | ✅ unmount cancel        | —                             | —       | —         | —           | —                   | —       |
| AC-14 memo 저장            | ✅     | ✅ migrate 테스트 | ✅ essay 파라미터 제거   | —                             | —       | —         | ⚠️ 미완     | ✅ 별점/서명 무변경 | —       |
| AC-15 재생성 5회 상한      | ✅     | N/A               | ✅ 단일 카운터           | ✅ 헬퍼 카피                  | —       | ⚠️ 미완   | ⚠️ 미완     | —                   | —       |

- Q9: 스트리밍 문자 타이머는 기존 훅 재사용, 추가 부하 없음.
- Q10: 네이티브 모듈 변경 없음.

## Findings

### P0 (ship blocker)

- 없음.

### P1

- 없음.

### P2

- Q6/Q7 실기 미확인. 부팅한 iPhone 16 Pro를 포함해 로컬 시뮬레이터에 `com.simune.mollip` / Expo Go가 없고, 저장소에 `ios/` 워크스페이스도 없어 `simctl`만으로는 화면을 열 수 없다. 스트리밍을 controlled TextInput에 바인딩하는 새 패턴(spec Risks)은 시뮬레이터에서 아직 눈으로 못 봤다.
- 생성 완료 직후 입력칸이 다시 포커스되면 `onFocus`가 `essayInputMode`를 `write`로 바꿀 수 있다. 브리프는 완료 후에도 `generate` 유지를 원한다. 실기에서 자동 재포커스가 일어나는지는 미확인.

## Evidence

| ID  | Path               | Description                                     |
| --- | ------------------ | ----------------------------------------------- |
| T1  | `npx tsc --noEmit` | 오류 0건                                        |
| T2  | `npx jest`         | 8 suites / 94 tests 통과 (이관 테스트 4개 포함) |
| V1  | —                  | 시뮬레이터 앱 미설치로 스크린샷 없음            |

## Regression paths walked

1. `confirmVisit` 시그니처에서 `essay` 제거 — 호출부는 `confirm-visits.tsx` 한 곳, 별점/서명 저장 로직은 유지.
2. `EssayStageSection` / `essayStageReady` / `onMemoDone` 잔존 참조 0건.
3. 다이어리 조회(`app/diary/[date].tsx`)는 계속 `visit.memo`만 읽음. 이관 후 옛 essay는 memo로 보임.
4. `buildEssayPrompt` 문자열 구조(한줄평: 라벨)는 유지 — LLM 입력 회귀 없음.

## Recommendation

- [x] Ready for Manager handoff (조건부 — 실기 스트리밍/토글/다음 버튼은 사용자 확인 필요)
- [ ] Return to Chris (Dev)
