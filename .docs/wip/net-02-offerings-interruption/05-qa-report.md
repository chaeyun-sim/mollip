---
feature-slug: net-02-offerings-interruption
author: taylor
status: complete
---

# QA report — NET-02

## Summary

- P0: 0
- Tier: S (버그/회귀 검증 — UI 변경 없음, Sam/Alex 단계 생략)
- Date: 2026-09-22
- **결론**: NET-01에서 구현한 `usePremiumPurchase`의 `requestIdRef`(요청 세대 보호) + `loadInFlightRef`(동시 호출 dedup) + `isMountedRef`(unmount 무효화) + `clearTimeout` 조합이 NET-02가 요구하는 레이스 시나리오를 **이미 구조적으로 방어하고 있음을 신규 테스트로 실증했다.** 프로덕션 코드 변경 없음(테스트 파일만 추가/수정).

## QA checks

- Q1: TypeScript compilation — `npx tsc --noEmit` exit 0
- Q2: Automated tests — `npx jest` exit 0, 30 suites / 309 tests pass (NET-01의 304개 + 신규 5개)
- Q3: Functional correctness — jest로 4개 레이스/동시성 시나리오 신규 검증
- Q4: UX — 변경 없음(NET-01 동일 UI 재사용)
- Q5: Convention — 테스트 파일만 수정, 기존 파일 구조·컨벤션 그대로
- Q6: Visual fidelity — 변경 없음(스크린샷 재검증 불필요 — 프로덕션 코드 무변경)
- Q7: Interaction — jest로 대체(사유: 실 네트워크 단절 재현 불가)
- Q8: Regression — 전체 jest suite(309개) 통과로 기존 NET-01 동작 무회귀 확인
- Q9: Performance — 해당 없음

## AC matrix

| AC                                                 | Q1 tsc | Q2 jest                                                | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact  | Q8 regress | Q9 perf |
| -------------------------------------------------- | ------ | ------------------------------------------------------ | ------ | ----- | ------- | --------- | ------------ | ---------- | ------- |
| AC-1 (구 요청 지연성공이 신 요청 실패를 안 덮어씀) | ✅     | ✅ (신규 1)                                            | ✅     | N/A   | ✅      | N/A       | ⚠️ jest 대체 | ✅         | N/A     |
| AC-2 (구 요청 지연실패가 신 요청 성공을 안 덮어씀) | ✅     | ✅ (신규 1)                                            | ✅     | N/A   | ✅      | N/A       | ⚠️ jest 대체 | ✅         | N/A     |
| AC-3 (loading/무상품에서 구매 SDK 0회)             | ✅     | ✅ (신규 1, 기존 커버리지와 합쳐 총 3개 상태에서 검증) | ✅     | N/A   | ✅      | N/A       | ⚠️ jest 대체 | ✅         | N/A     |
| AC-4 (재시도 연타 dedup)                           | ✅     | ✅ (신규 1 + 기존 1)                                   | ✅     | N/A   | ✅      | N/A       | ⚠️ jest 대체 | ✅         | N/A     |

## Findings

### P0 (ship blocker)

- (없음)

### P1

- (없음)

### P2

- (없음, NET-01의 P2 두 건 참고: `05-qa-report.md`(net-01) — InteractionManager 경고, orphan 파일(이미 외부에서 삭제 확인됨 — `git status`에 더 이상 나타나지 않음))

### 검증 과정에서 발견한 테스트 버그(참고용, 코드 결함 아님)

- 최초 작성한 "동일 틱 연타 dedup" 테스트가 `toHaveBeenCalledTimes(1)`을 기대했으나, 마운트 시 자동 호출(1회)을 누락 계산한 assertion 오류였다. 실제로는 마운트 1회 + dedup된 재시도 1회 = 총 2회가 정상이며, 수정 후 통과했다. 이는 프로덕션 코드가 아니라 테스트 작성 실수였음을 재실행 로그로 확인했다.

## Evidence

| ID  | Path                                                              | Description                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `npx tsc --noEmit` (exit 0)                                       | 타입 오류 0건                                                                                                                                                                                                         |
| E2  | `npx jest` (exit 0, 30 suites / 309 tests)                        | 전체 스위트 통과, NET-01 회귀 없음                                                                                                                                                                                    |
| E3  | `src/hooks/__tests__/usePremiumPurchase.test.tsx` 신규 5개 테스트 | "타임아웃된 이전 요청이 나중에 성공으로 도착해도...", "이전 요청이 뒤늦게 실패로 도착해도...", "loading 상태에서는 구매 SDK가 절대 호출되지 않는다", "재시도 버튼을 동일 틱에 연타해도..." 등 `NET-02:` 접두사로 표시 |

## Regression paths walked

1. 전체 jest suite 재실행으로 NET-01 구매/uncertain/복원/잠금 경로 무회귀 확인
2. `git status`로 NET-01 산출물(프로덕션 파일) 무변경 확인 — 이번 변경은 테스트 파일 1개(`usePremiumPurchase.test.tsx`)뿐

## Return reason

- (해당 없음)

## Recommendation

- [x] Ready for Manager handoff
- [ ] Return to Chris (Dev)

## 블로커 — 구조적 환경 제약

- 실제 네트워크 단절(비행기 모드) 재현 및 실 Apple StoreKit 결제 검증은 이 세션에서 수행하지 않았다. NET-01의 `06-handoff-to-user.md`에 기재된 동일 블로커(RevenueCat Test Store 키, 자격증명 미보유)가 그대로 적용된다. 이번 NET-02 작업은 프로덕션 코드 변경이 없었으므로 별도의 신규 실기기 검증 필요성도 없다고 판단한다.
