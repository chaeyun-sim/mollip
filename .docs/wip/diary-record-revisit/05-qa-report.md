---
feature-slug: diary-record-revisit
author: taylor
status: pass-with-manual-qa
---

# QA report (v3 — 순차 질문 플로우)

## v4 소형 크기 조정 확인 (2026-10-14)

- `app/diary/record/write.tsx`: 방문일 36→26px, 달력 아이콘 22→18px, 별점 44→30px. 반 점 안내 문구 제거.
- `npx tsc --noEmit`: 통과(0 errors). `git diff --check`: 통과.
- `npx prettier --check app/diary/record/write.tsx`: 통과.
- 시뮬레이터 시각/인터랙션 확인은 미완료: `v3-open.yaml` 탭 후 앱이 홈 화면으로 빠져 `질문 1 / 4` assertion 실패. 캡처 파일 `evidence/v4-current.png`는 iOS 홈 화면이며 UI 증빙으로 사용할 수 없다. 재진입 후 수동/자동 확인 필요.
- 따라서 v4 크기 조정의 시각 QA는 **미검증 / Manual QA Required**로 남긴다. 기존 v3 기능 QA 결과는 유지한다.

## Summary

- P0: 0 / P1: 0 / P2: 4
- Tier: M
- Date: 2026-10-14
- 사용자 피드백(v3)으로 기록하기 2단계를 **한 번에 한 질문**(방문일 → 별점 → 사진 → 재방문)으로 교체했다. 데이터·영속 계층(`isRevisit` → `saveRecord` → `DayVisit` → SQLite + 마이그레이션)은 이전 그대로다.
- **시설 평가는 구현하지 않았다**(사용자 확인 대기). 질문 목록은 `WRITE_STEPS` 배열이라 답이 오면 한 단계 + 필드만 더하면 된다. 이번 UI·테스트는 4단계 기준이다.
- 한계: 시뮬레이터에서 **최종 저장(`기록 남기기`)은 하지 않았다** — 로그인 여부를 확정할 수 없어 원격 `visits` 행이 생길 수 있다. 캡션 화면까지만 이동·복귀했다.

## 이번 개정에서 바뀐 파일

- 신규: `src/utils/recordWriteFlow.ts`(질문 순서·이동·진행 조건), `src/hooks/useRecordWriteFlow.ts`(이동·Android 뒤로가기), `src/components/record/RecordQuestion.tsx`, `RecordWriteProgress.tsx`, `RecordChoice.tsx`
- 수정: `app/diary/record/write.tsx`(재작성), `src/store/recordDraftStore.ts`(`writeStep?`)
- 이전 개정에서 유지: `StarRating tone="cocoa"`, `FrameCard`/`RecordFramePreview` `compact`
- 신규 테스트: `recordWriteFlow.test.ts`(질문 순서·경계·진행 조건), `recordDraftStore.test.ts` 확장(`writeStep` 유지/초기화)
- 라우트·캡션 가드·`caption.tsx` 불변.

## QA checks

- Q1 `npx tsc --noEmit`: 0 errors
- Q2 `npm test`: 앱 47 suites / 362 tests 통과. 실패 11 suites는 모두 `.agents/skills/claude-to-im/**` 모듈 해석 오류(이번 변경과 무관). 그 외 FAIL 없음(`evidence/jest.log`). 집중 실행: `recordWriteFlow` / `recordDraftStore` / `visitStore.saveRecord` / `localVisitDb` / `localVisitDb.revisit` 5 suites·21 tests 통과
- Q3 기능/edge: 아래 Exception QA
- Q4 UX: 한 화면 한 질문, 진행 "질문 n / 4", 뒤로/다음 고정 위치
- Q5 convention: eslint 0, prettier 통과. 컴포넌트는 named export + interface Props, 한 가지 역할(질문 레이아웃 / 진행 / 선택지), `cn`·`handle`이 아닌 훅으로 로직 분리(`useRecordWriteFlow`), 긍정 조건·`&&` 사용, 화면 조립만 `app/`에 둠
- Q6 시각: 내가 직접 연 스크린샷 — `evidence/v3-1-date.png`, `v3-2-rating-empty.png`, `v3-2-rating-filled.png`, `v3-3-photos.png`, `v3-4-revisit-empty.png`, `v3-4-revisit-yes.png`, `v3-4-revisit-restored.png`. 이전 버전은 `evidence/v1/`, `evidence/v2/`
- Q7 인터랙션(Maestro, 시뮬레이터): 아래 표
- Q8 회귀: 1단계(전시 고르기)에서 진입/복귀, 캡션 진입·복귀, 신규 draft 시 첫 질문부터 시작, `FrameCard`·`StarRating` 기본 동작은 이전 개정에서 다이어리 벽·캡션으로 확인
- Q9 perf(light): 질문 전환은 draft `patch` 1회 + 180ms 페이드. 단계 상태를 draft에 둬 별도 effect 없음
- Q10 네이티브: 변경 없음

### Q7 인터랙션 결과 (Maestro)

| 플로우                      | 확인 내용                                                                                               | 결과                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `v3-to-rating.yaml`         | 방문일 → `다음` → 별점. 별점이 없을 때 `다음` 눌러도 이동하지 않음                                      | ✅                                                                 |
| `v3-rating-to-photos.yaml`  | 5번째 별 왼쪽 탭 → `4.5 / 5`, `다음` → 사진, 사진 0장이면 `건너뛰기`                                    | ✅                                                                 |
| `v3-photos-to-revisit.yaml` | `건너뛰기` → 재방문. 선택 전 `다음` 눌러도 캡션으로 가지 않음                                           | ✅                                                                 |
| `v3-choose-yes.yaml`        | "네, 다시 찾았어요" 탭                                                                                  | ✅ 탭 동작. 선택 상태는 스크린샷으로 확인(체크·테두리·`다음` 활성) |
| `v3-back-forward.yaml`      | 질문 4→3→2→1로 뒤로, 다시 앞으로. 별점 4.5 유지, 재방문 "네" 유지(스크린샷 `v3-4-revisit-restored.png`) | ✅                                                                 |
| `v3-caption-roundtrip.yaml` | 마지막 질문 `다음` → 캡션 → 헤더 뒤로 → 마지막 질문 복원("질문 4개 중 4번째")                           | ✅                                                                 |
| `v3-first-back.yaml`        | 마지막 질문에서 뒤로 3번 → 첫 질문, 한 번 더 → 1단계(전시 고르기)                                       | ✅                                                                 |
| `v3-reenter-rating.yaml`    | 1단계에서 전시를 다시 고르면 새 draft로 첫 질문부터                                                     | ✅                                                                 |

### 한계 (사실대로)

- Maestro(iOS)는 `radio`의 `checked` 상태를 읽지 못해 `checked: true` 단언이 실패했다. 선택 상태는 스크린샷으로만 확인했다(코드는 `accessibilityState.checked` 전달).
- 사진 선택기 사용·사진 6장 레이아웃은 시뮬레이터에서 실행하지 않았다.
- Reduce Motion 켠 상태는 시뮬레이터에서 켜 보지 않았다. 코드는 `useReducedMotion()`이 true면 페이드(`entering`)와 진행 바 전환을 끈다(`RecordFramePreview`와 같은 기존 패턴).
- 별 탭 좌표(74%,46%)는 별 크기 변경 시 다시 맞춰야 하는 자동화 의존 값이다.
- 이전 개정의 "앱 재실행 직후 첫 탭이 반영되지 않은 1회 사례"는 이번 실행에서는 재현되지 않았다. 원인은 여전히 확정하지 못했다.
- 이번 실행 중 앱이 한 번 홈 화면으로 나가 있었다(같은 PID라 크래시는 아님). 원인은 확정하지 못했고, 다시 포그라운드로 올려 진행했다.

## AC matrix (A2 반영)

| AC    | Q1 tsc | Q2 jest                   | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact                         | Q8 regress | Q9 perf |
| ----- | ------ | ------------------------- | ------ | ----- | ------- | --------- | ----------------------------------- | ---------- | ------- |
| AC-1′ | ✅     | ✅ flow 진행 조건·draft   | ✅     | ✅    | ✅      | ✅        | ✅ 선택/미선택 `다음` 차단          | ✅         | ✅      |
| AC-2  | ✅     | ✅ saveRecord             | ✅     | —     | ✅      | —         | ⚠️ 저장 미실행(Manual)              | ✅         | ✅      |
| AC-3  | ✅     | ✅ 마이그레이션·왕복·slim | ✅     | —     | ✅      | —         | ✅ 실제 DB 컬럼(이전 개정에서 확인) | ✅         | ✅      |
| AC-4′ | ✅     | ✅ 순서·경계              | ✅     | ✅    | ✅      | ✅        | ✅ 4개 질문 순차                    | ✅         | ✅      |
| AC-5  | ✅     | ✅ writeStep 유지         | ✅     | ✅    | ✅      | ✅        | ✅ 앞뒤·캡션 왕복 복원              | ✅         | ✅      |
| AC-6  | ✅     | ✅ 사진은 항상 통과       | ✅     | ✅    | ✅      | ✅        | ✅ 0장이면 `건너뛰기` 표시·이동     | ✅         | ✅      |

방문일 기본값·날짜 범위(`min/max`, 고정일 잠금)·별점 0.5 단위/필수·사진 최대 6장 로직은 이전 코드를 그대로 가져왔다(`getRecordDateKey`, `DatePickerModal` props, `StarRating`, `PhotoGrid max`). 날짜 피커를 이번 UI에서 열어 보지는 않았다(Manual).

## Exception QA (코드·테스트 근거)

| #     | 시나리오                                                                            | 결과                                                                                                                        |
| ----- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| E1–E8 | DB 마이그레이션, 0/1/NULL 왕복, false 보존, 병합, 원격 미전송, keywords 비침투      | ✅ Jest (이전과 동일, 계속 통과)                                                                                            |
| E9    | `writeStep`이 알 수 없는 값/저장 없음 → 첫 질문으로 복귀                            | ✅ Jest(`resolveWriteStep`)                                                                                                 |
| E10   | 재방문 미선택(undefined) 상태로 캡션 진입 시도                                      | ✅ 막힘 — `canAdvance`가 false라 `goNext`가 일찍 반환(Jest + 시뮬레이터)                                                    |
| E11   | 재방문 "아니요" 선택 → false 저장                                                   | ✅ draft false로 통과 허용(Jest). 저장 단계는 `?? false`지만 이제 항상 명시값                                               |
| E12   | 캡션에서 뒤로 → 마지막 질문 복원, 답 유지                                           | ✅ 시뮬레이터                                                                                                               |
| E13   | iOS 스와이프 백(질문 2~4에서 비활성), Android 하드웨어 뒤로(이전 질문)              | 미검증 / Manual QA Required (코드: `gestureEnabled: stepIndex === 0`, `BackHandler`)                                        |
| E14   | 앱 재시작 시 draft 소실                                                             | ✅ 기존 가드(처음 화면으로)                                                                                                 |
| E15   | 사진 업로드 실패 후 재시도 시 draft 유지                                            | ✅ 코드만 — 실패 경로가 `reset()`을 부르지 않음                                                                             |
| E16   | 방문일 고정(도슨트) 질문: 자물쇠 + "도슨트 관람일로 고정", 탭 비활성, `다음`은 활성 | 미검증 / Manual QA Required (시뮬레이터에서 고정 draft 진입 경로 없음)                                                      |
| E17   | VoiceOver(질문 header, radiogroup, progressbar 라벨), 큰 글씨                       | 미검증 / Manual QA Required                                                                                                 |
| E18   | 사진 6장 레이아웃/스크롤, 사진 선택·삭제                                            | 미검증 / Manual QA Required                                                                                                 |
| E19   | 빠르게 `다음` 연타                                                                  | 코드 근거만 — 단계는 draft에서 읽으므로 1칸씩만 증가(디바운스 없음). 마지막 질문에서 연타 시 `router.push` 중복 가능성 → P2 |
| E20   | 시설 평가 질문 추가                                                                 | 범위 밖(사용자 확인 대기)                                                                                                   |

## Findings

### P0 / P1

- 없음

### P2

1. 마지막 질문에서 `다음` 연타 시 `router.push('/diary/record/caption')`가 중복될 수 있다(디바운스 없음). 기존 단계 버튼도 같은 구조라 이번에 수정하지 않았다.
2. `useVisitSync` 병합 경로의 `isRevisit` 보존 단위 테스트 없음(훅 테스트 하네스 부재).
3. 화면 하단 약 45%가 비어 보인다(Alex 후속 제안). 의도된 집중 레이아웃이지만 사용자 평가가 필요하다.
4. Maestro가 radio `checked`를 못 읽어 자동화 단언이 약하다(스크린샷 의존).

## Evidence

| ID  | Path                                                                                   | Description                                  |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| ev1 | `evidence/v3-1-date.png`                                                               | Q1 방문일                                    |
| ev2 | `evidence/v3-2-rating-empty.png`, `v3-2-rating-filled.png`                             | Q2 별점(비어 있음 / 4.5)                     |
| ev3 | `evidence/v3-3-photos.png`                                                             | Q3 사진(0장, `건너뛰기`)                     |
| ev4 | `evidence/v3-4-revisit-empty.png`, `v3-4-revisit-yes.png`, `v3-4-revisit-restored.png` | Q4 재방문(미선택 / 선택 / 앞뒤 이동 후 복원) |
| ev5 | `evidence/v3-*.yaml`                                                                   | Maestro 플로우                               |
| ev6 | `evidence/jest.log`                                                                    | `npm test` 로그                              |
| ev7 | `evidence/v1/`, `evidence/v2/`                                                         | 폐기된 이전 화면(비교용)                     |

## Regression paths walked

1. 1단계 전시 선택 → Q1~Q4 순차 → 뒤로 3회 → 첫 질문 → 뒤로 → 1단계
2. Q4 선택 → 캡션 → 뒤로 → Q4 복원(답 유지)
3. 1단계에서 전시 재선택 → 새 draft로 Q1부터

## Return reason

- [ ] 해당 없음

## Recommendation

- [x] Ready for Manager handoff (Manual QA 항목 포함)
