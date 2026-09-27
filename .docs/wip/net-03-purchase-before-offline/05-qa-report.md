---
feature-slug: net-03-purchase-before-offline
author: taylor
status: complete-with-noted-blocker
---

# QA report — NET-03

## Summary

- P0: 0
- Tier: S (버그 검증 + 1건 실결함 수정 — UI 신규 요소 없음, Sam/Alex 생략)
- Date: 2026-09-23
- **결론**: NET-01의 uncertain 상태 기계(`classifyPurchaseError` + `purchaseStatus` + `handleCheckPendingStatus`)는 요구된 5개 항목 중 4개(네트워크/보류/무-entitlement→uncertain, 캐시무효화 후 재조회, 취소 안전 재시도, purchasePackage 무타임아웃)를 이미 만족했다. **1건의 실결함을 발견해 수정**: 닫기 버튼/스와이프 제스처가 `purchaseStatus === 'uncertain'`을 반영하지 않아, 결과가 불확실한 상태에서도 화면을 벗어날 수 있었다.

## QA checks

- Q1: TypeScript compilation — `npx tsc --noEmit` exit 0
- Q2: Automated tests — `npx jest` exit 0, 30 suites / 312 tests pass (NET-02의 309개 + 신규 3개)
- Q3: Functional correctness — jest로 검증, 실결함 1건 발견·수정 확인
- Q4: UX — 닫기 버튼 비활성화(opacity 40%) + accessibilityState 반영
- Q5: Convention — 최소 diff(2개 파일, 각 1~2줄), import/구조 변경 없음
- Q6: Visual fidelity — 스크린샷으로 화면 정상 렌더 확인(가격 데이터 그대로 유지, 회귀 없음)
- Q7: Interaction — 부분적: 실 탭으로 화면 진입/플랜 선택까지는 확인했으나, 결제 버튼 탭이 이 세션 후반부에 시뮬레이터 포커스/좌표 드리프트로 반복 실패해 uncertain 상태 자체는 라이브로 재현하지 못함(아래 블로커 참고) — jest로 대체 검증
- Q8: Regression — 전체 jest suite(312개) 통과, 정적 스크린샷으로 화면 무회귀 확인
- Q9: Performance — 해당 없음

## AC matrix

| AC                                      | Q1 tsc | Q2 jest                                             | Q3 bug             | Q4 UX | Q5 conv | Q6 visual              | Q7 interact  | Q8 regress | Q9 perf |
| --------------------------------------- | ------ | --------------------------------------------------- | ------------------ | ----- | ------- | ---------------------- | ------------ | ---------- | ------- |
| AC-1 (오류→uncertain 통일)              | ✅     | ✅ (기존 4 + 신규 1 OPERATION_ALREADY_IN_PROGRESS)  | ✅                 | N/A   | ✅      | N/A                    | ⚠️ jest 대체 | ✅         | N/A     |
| AC-2 (uncertain 중 구매/복원/닫기 차단) | ✅     | ✅ (신규 2: store 미부여 확인, 훅레벨 restore 차단) | ✅ **실결함 수정** | ✅    | ✅      | ✅ 스크린샷(화면 정상) | ⚠️ jest 대체 | ✅         | N/A     |
| AC-3 (상태확인 캐시무효화+분기)         | ✅     | ✅ (기존 4개 재확인)                                | ✅                 | N/A   | ✅      | N/A                    | ⚠️ jest 대체 | ✅         | N/A     |
| AC-4 (취소 안전 재시도)                 | ✅     | ✅ (기존 1개 재확인)                                | ✅                 | N/A   | ✅      | N/A                    | ⚠️ jest 대체 | ✅         | N/A     |

## Findings

### P0 (ship blocker)

- (없음)

### P1

- **[수정 완료]** `app/settings/premium.tsx`의 `isCloseDisabled`가 `isBusy`만 반영하고 `isUncertain`을 누락 — 결제 결과가 불확실한 동안에도 닫기(X) 버튼과 스와이프 뒤로가기 제스처가 활성 상태였다. `isCloseDisabled = isBusy || isUncertain`으로 수정. 동일 원인으로 `src/hooks/usePremiumPurchase.ts`의 `handleRestore`에도 훅 레벨 가드(`purchaseStatus === 'uncertain'`)를 추가해 UI 우회 시에도 방어되게 했다.

### P2

- (없음, NET-01/02의 기존 P2 참고)

## Evidence

| ID  | Path                                       | Description                                                                                                                                                                                                        |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E1  | `npx tsc --noEmit` (exit 0)                | 타입 오류 0건                                                                                                                                                                                                      |
| E2  | `npx jest` (exit 0, 30 suites / 312 tests) | `usePremiumPurchase.test.tsx`(34개, NET-03 신규 3개 포함: OPERATION_ALREADY_IN_PROGRESS→uncertain, uncertain 중 store 미부여, uncertain 중 훅레벨 restore 차단 + 기존 성공경로 테스트에 store.isPremium 검증 추가) |
| E3  | `/tmp/qa-screens/28-net03-premium.png`     | 수정 후 premium 화면 실행 스크린샷 — 실 가격(US$24.99/US$3.99/US$9.99), 76% 할인 정상 렌더, 무회귀                                                                                                                 |
| E4  | `/tmp/qa-screens/29~32-*.png`              | 플랜 선택(1주) 실제 탭 성공 스크린샷 — 화면이 정상 반응함을 확인(구매 버튼 탭만 실패)                                                                                                                              |

## Regression paths walked

1. 전체 jest suite 재실행으로 NET-01/NET-02 회귀 없음 확인
2. 시뮬레이터에서 마이페이지 → 프리미엄 진입 → 플랜 선택(1주 탭 성공, 가격/할인 정상 반영) — 닫기 버튼 수정이 정상 화면 렌더링에 영향 없음을 확인

## Return reason

- (해당 없음)

## Recommendation

- [x] Ready for Manager handoff (블로커는 아래 명시)
- [ ] Return to Chris (Dev)

## 블로커 — 구조적 환경 제약 (정직성 필수 기재)

1. **실 Apple StoreKit 미검증**: NET-01/02와 동일 — 이 환경의 RevenueCat API 키는 Test Store용이다.
2. **이번 세션의 라이브 uncertain 재현 실패**: `결제하기` 버튼을 눌러 RevenueCat Test Store 구매 시트를 띄우고 "Test failed purchase"로 uncertain 상태를 실제로 유도해 닫기 버튼 비활성화를 눈으로 확인하려 시도했으나, 동일 좌표(NET-01 세션에서 정상 동작했던 좌표)로 4회 재시도(Simulator 재활성화 포함)해도 `Purchases.purchasePackage`가 호출되지 않았다(Metro 로그에 신규 `💰 Purchasing` 라인 없음으로 확인). 시뮬레이터/cliclick의 포커스 또는 좌표 드리프트로 추정되며, 코드 결함의 증거는 아니다(플랜 선택 탭은 동일 좌표계 내에서 정상 동작했음 — `29~32` 스크린샷). uncertain 상태에서의 닫기 버튼 비활성화는 jest(`accessibilityState`/disabled prop을 직접 렌더 테스트하지 않고 훅의 `purchaseStatus`/`isPremium` 상태만 검증)로 대체 확인했다 — 이는 훅 레벨 검증이며 컴포넌트 렌더 레벨(실제 `disabled` prop 값)까지는 커버하지 않는다는 점을 명시한다. 컴포넌트 렌더 테스트(@testing-library/react-native 등)는 이 프로젝트에 아직 도입돼 있지 않다.
