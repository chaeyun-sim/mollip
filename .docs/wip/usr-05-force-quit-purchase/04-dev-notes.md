---
feature: USR-05 결제 중 강제 종료
status: complete-per-ac (see 05-qa-report.md for Manual QA gaps)
updated: 2026-09-25
---

## 이번 라운드에서 한 일

이전 버전 문서는 "완료"로 표시돼 있었지만 실제 코드 감사(01-spec.md §3)로 5개 결함(D1~D5)을 발견했다. 그중 D1~D4를 코드로 수정했고, D5는 결함이 아님을 확인해 문서만 정정했다.

- **AC-1 (문서 정정)**: `01-spec.md`를 실제 아키텍처(영속 표식은 `purchaseTransactionStore`가 아니라 `subscriptionVerification.ts`에 있음) 기준으로 재작성했다.
- **AC-2 (영속 기록 쓰기 순서, D1)**: `src/hooks/usePremiumPurchase.ts`의 `handlePurchase`에서 `markPendingPurchaseReconciliation()`을 `void`로 fire-and-forget하던 것을 `await`로 바꿔, `Purchases.purchasePackage()` 호출 전에 영속 쓰기가 반드시 끝나도록 순서를 고정했다.
- **AC-3 (저장 실패 관측, D4)**: `src/lib/subscriptionVerification.ts`의 `markPendingPurchaseReconciliation`/`clearPendingPurchaseReconciliation` catch 블록에 Sentry breadcrumb(`purchase.pending-reconciliation`)을 추가했다. 구매 흐름은 계속 진행한다(저장 실패로 IAP를 막지 않음).
- **AC-4 (재실행 후 UI 노출, D2)**: `usePremiumPurchase`가 `isPendingTransaction`을 반환하도록 하고, `app/settings/premium.tsx`가 이를 구독해 `purchaseStatus`(로컬, 재실행 시 항상 `idle`)와 무관하게 상태 확인 배너·버튼·구매 버튼 비활성화에 반영하게 했다(`needsReconciliationCheck = isUncertain || isTimedOut || isPendingTransaction`). 기존 배너/버튼 컴포넌트를 그대로 재사용했으므로 새 디자인 산출물은 만들지 않았다(component-convention §3 조건부 렌더링 규칙만 확장).
- **AC-5 (포그라운드 복귀 시 정리, D3)**: `app/_layout.tsx`의 `AppState` 리스너가 활성 entitlement를 확인하면 `clearPendingPurchaseReconciliation()` + `usePurchaseTransactionStore.getState().clearPending()`을 함께 호출하도록 확장했다.

## 건드리지 않은 것

- 계정 경계(D5): RevenueCat이 앱 계정과 무관한 기기 단위 익명 ID를 쓰고 있음을 확인했다. 버그가 아니므로 변경하지 않았다(01-spec.md §3 D5).
- `Purchases.syncPurchasesForResult()` 전환, pending 상태 폴링/재시도 루프 신설 — 01-spec.md §7 범위 밖으로 명시.
- 부트스트랩이 재확인 실패 시 표식을 지우지 않는 기존 동작 — 의도된 안전한 기본값이라 유지.

## 테스트 변경

`src/hooks/__tests__/usePremiumPurchase.test.tsx`의 연타 방지 테스트 3건(동일 틱 2회 호출, 10회 연타, 플랜 변경 유지)은 `await markPendingPurchaseReconciliation()`으로 SDK 호출이 한 틱 늦춰지므로 `act()` 동기 호출 직후 `flush()`를 한 번 추가해 타이밍을 맞췄다. 가드 로직(`purchaseOpRef.current`)은 여전히 await 이전에 동기적으로 설정되므로 중복 호출 방지 자체는 변경되지 않았다.
