---
feature: USR-05 결제 중 강제 종료
tier: M
status: draft
updated: 2026-09-25
revision: 3
---

## 0. 문서 정정 이력

### 0.1 2차 정정 (이전 라운드)

이전 `01-spec.md`(status: implemented)와 `04-dev-notes.md`/`05-qa-report.md`/`06-handoff-to-user.md`는 "완료"로 기록되어 있었으나, 실제 코드 감사 결과 다음이 확인됐다.

- **오귀속 정정**: 영속 pending 표식 로직은 `src/store/purchaseTransactionStore.ts`가 아니라 `src/lib/subscriptionVerification.ts`(AsyncStorage 키 `@mollip/subscription/pending-purchase-reconciliation`)에 있다. `purchaseTransactionStore`는 zustand 메모리 상태만 보관한다.
- **미기록 결함 D1~D5** (§3).

### 0.2 3차 정정 (이번 라운드, 검수 피드백 반영)

2차 라운드 결과를 사후 검수한 결과 다음이 사실과 달랐거나 누락됐다.

1. **게이트 누락**: tier M 파이프라인(`feature-pipeline.md` §1)의 Sam(`02-design-brief.md`)·Alex(`03-design-review.md`) 단계를 건너뛰고 "기존 컴포넌트 재사용이라 새 디자인 산출물 불필요"로 자체 판단했다. 배너 노출 조건·문구를 바꾸는 UI 변경이 있었으므로 G2/G3 대상이다. 이번 라운드에서 사후 작성·검수하며 누락 사실을 `05-qa-report.md` §게이트 기록에 남긴다.
2. **시점 A 모순**: 2차 §2 표는 "A. 결제 시트 표시 직후 → pending 없음"이라고 적었지만, 같은 문서 §4.1은 표식을 `await`로 먼저 저장한 뒤 SDK를 호출하도록 설계했다. 그 설계에서는 시트가 뜬 시점에 표식이 이미 디스크에 있으므로 재실행 시 pending은 **반드시 있다**. §2를 정정한다.
3. **근거 없는 SDK 단정**: 2차 §2·§4.7은 "미종료 트랜잭션은 다음 `configure()`에서 SDK가 다시 관찰해 서버에 보고한다", "`configure()` 시점에 자체적으로 큐를 스캔하므로 대부분 결과적으로 동일"이라고 단정했다. 이 저장소의 `react-native-purchases@10.10.0` 타입 정의(`purchases.d.ts:513-519`)는 `getCustomerInfo`를 "Gets current customer info"로만 설명하며, 반환값이 항상 최신이라거나 미완료 거래가 없음을 확정한다는 보장은 없다. SDK 네이티브 소스를 확인하지 않았으므로 해당 문장들은 **검증되지 않은 가설**로 강등한다(§4.7).
4. **새 결함 D6~D9** (§3) — 2차 수정으로 새로 생긴 경쟁 조건과, 2차에서 놓친 경로.

## 1. 배경 (실제 아키텍처)

| 계층                                    | 파일                                                                                                            | 수명                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 세션 내 메모리 상태                     | `src/store/purchaseTransactionStore.ts` (`isPending`, `pendingSince`, `isPurchaseInFlight`, `generation`)       | 앱 프로세스 생존 중에만          |
| 영속 pending 표식                       | `src/lib/subscriptionVerification.ts` (AsyncStorage, 값 = 표식 기록 시각 ms. 구버전 값 `'1'`은 시각 0으로 해석) | 앱 재설치 전까지                 |
| 재실행·포그라운드·리스너 reconciliation | `src/lib/purchaseReconciliation.ts`                                                                             | —                                |
| 권한의 정본                             | RevenueCat `CustomerInfo` (`getCustomerInfo`, `addCustomerInfoUpdateListener`)                                  | RevenueCat 서버·기기 StoreKit 큐 |

## 2. 사용자 시나리오 (강제 종료 시점별, 3차 정정)

AC-2 이후 구매 시작 순서는 "표식 저장 완료 → SDK 호출"이다. 따라서 결제 시트가 한 번이라도 떴다면 표식은 이미 디스크에 있다.

| 시점                                                 | StoreKit/RevenueCat 상태                        | 재실행 시 기대 동작                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A0. "결제하기" 탭 후 표식 저장 완료 전(시트 표시 전) | SDK 미호출 → 거래 없음                          | 표식이 없을 수도(저장 전 종료), 있을 수도(저장 직후 종료) 있다. 있으면 A와 동일                                                                                                                                                                                                                                          |
| A. 결제 시트 표시 직후, 탭도 안 한 상태              | 거래 없음(사용자가 승인하지 않음)               | **pending 있음**. 앱은 거래가 없다는 사실을 스스로 알 수 없으므로 자동 해제하지 않는다. 재조회 결과가 inactive면 표식 유지 → 프리미엄 화면에 "이전에 진행하던 구매" 배너 + 상태 확인 버튼. 사용자가 상태 확인을 눌러 inactive를 확인하면 해제되고 재구매 가능                                                            |
| B. 인증 중(Face ID/암호)                             | 거래가 큐에 들어갔는지 불확정                   | A와 동일한 처리. inactive는 "실패 확정"이 아니다                                                                                                                                                                                                                                                                         |
| C. Apple 승인 직후, RevenueCat 서버 반영 전          | StoreKit 거래 완료, RevenueCat 반영 여부 불확정 | 재조회가 **새로 생긴** active entitlement(표식 기록 이후 구매)를 돌려주면 자동 해제·권한 반영. inactive가 먼저 오고 승인이 나중에 반영되는 경우(조기 inactive → 늦은 승인)도 있다고 가정한다 — 표식을 유지하고, 늦게 도착한 CustomerInfo(리스너·포그라운드 재조회·수동 확인)가 새 entitlement를 보여주는 시점에 해제한다 |

원칙: 강제 종료 자체는 성공/실패를 의미하지 않는다. **자동 경로(부트스트랩·포그라운드·리스너)는 "표식 기록 이후에 구매된 active entitlement"를 볼 때만 표식을 해제한다.** inactive만으로 해제하는 것은 사용자가 명시적으로 상태 확인을 눌렀을 때뿐이다.

## 3. 결함

### D1~D5 (2차 라운드 도출, 요약)

- **D1** 표식 쓰기를 await하지 않고 SDK 호출 → 강제 종료 시 표식 누락 가능. (AC-2)
- **D2** 재실행 후 pending이 화면에 노출되지 않아 구매 버튼이 조용히 no-op. (AC-4)
- **D3** 포그라운드 복귀 재조회가 pending을 정리하지 않음. (AC-5)
- **D4** 표식 저장 실패가 관측 불가. (AC-3)
- **D5** RevenueCat App User ID가 기기 단위 익명 ID — 결함 아님, 범위 밖.

### D6 — 저장 대기 구간이 try/finally 밖, 화면 잠금 전 (2차 수정이 만든 결함, Critical)

2차 수정은 `await markPendingPurchaseReconciliation()`을 `try` 밖, `setIsPurchasing(true)`보다 앞에 두었다. 저장을 기다리는 동안:

- `isBusy`가 false라 닫기 버튼·스와이프가 살아 있다 → 화면을 닫아도 await가 끝나면 **언마운트된 화면에서 `purchasePackage`가 호출되어 결제 시트가 뜬다**.
- 저장이 예외로 끝나면(현재 구현은 내부 catch라 발생하지 않지만 구조상) `releaseOperation`·`purchaseOpRef` 해제가 실행되지 않는다.

**해결**: `setIsPurchasing(true)`를 await 전으로 옮기고 await를 `try` 안으로 넣는다. await 이후 언마운트됐으면 SDK를 호출하지 않고 표식·메모리 pending을 되돌린다(SDK 미호출이므로 거래가 존재할 수 없다).

### D7 — "진행 중 구매"와 "재실행 reconciliation"이 같은 플래그 (Critical)

메모리 `isPending`이 두 의미로 쓰였다. 그 결과:

- 평범한 구매 진행 중에도 `isPendingTransaction`이 true라 "이전에 진행하던 구매가 있어요" 배너와 상태 확인 버튼이 노출된다.
- 구매 진행 중 상태 확인을 누르면 `getCustomerInfo`가 inactive를 돌려주고, 진행 중인 구매의 영속 표식과 메모리 pending이 **지워진다** — 이후 강제 종료되면 재실행 시 재확인 대상에서 빠진다.

**해결**: `isPurchaseInFlight`(구매 버튼 탭부터 SDK 응답 settle까지; 타임아웃 후에도 SDK가 settle하지 않았다면 유지)를 별도로 둔다. 상태 확인은 in-flight 중 inactive 결과로 표식을 지우지 않는다. 배너는 in-flight가 아닐 때의 pending만 "이전 구매"로 표시한다.

### D8 — 포그라운드 재조회가 새 구매 pending을 오래된 entitlement로 지움

결제 시트 표시·해제는 iOS에서 AppState `inactive → active` 전환을 일으키므로 포그라운드 핸들러는 구매 도중에도 실행된다. 핸들러는 `entitlements.active[ENTITLEMENT_ID]` 존재만 보고 표식을 지웠다. 기존에 활성 entitlement가 있던 계정(또는 재조회가 구매 시작 전에 시작돼 늦게 끝난 경우)은 **새 구매의 pending이 오래된 entitlement 때문에 지워진다**.

**해결**: 자동 해제 조건 = (pending 있음) ∧ (in-flight 아님) ∧ (재조회 시작 시점과 generation 동일 — 그 사이 새 구매가 시작되지 않음) ∧ (active entitlement의 `latestPurchaseDateMillis` ≥ `pendingSince`). `latestPurchaseDateMillis`는 `@revenuecat/purchases-typescript-internal/dist/customerInfo.d.ts:45`에 정의된 필드다.

### D9 — 부트스트랩이 inactive 결과로도 표식을 해제 (조기 inactive)

2차 부트스트랩은 재조회가 성공하기만 하면 entitlement 여부와 무관하게 표식을 지웠다. 조기 inactive(§2 C) 후 늦은 승인 경우, 앱은 재확인 기회를 잃고 사용자는 배너 없이 재구매를 시도할 수 있다.

**해결**: 부트스트랩도 D8의 자동 해제 조건을 따른다. inactive면 표식 유지 → 화면 배너(AC-4) → 사용자 명시 확인. 늦은 CustomerInfo 리스너 이벤트도 같은 조건으로 표식을 해제한다.

## 4. 해결 설계

### 4.1 구매 시작 순서 (D1, D6, D7)

```
"결제하기" 탭
  → purchaseOpRef / acquireOperation('purchase')
  → setIsPurchasing(true)                     (화면 닫기·스와이프 차단)
  → beginPurchaseAttempt(since)               (메모리 isPending + isPurchaseInFlight, generation+1)
  → try {
      await markPendingPurchaseReconciliation(since)   (완료까지 대기, 실패해도 진행 — D4)
      언마운트됐으면 → 메모리·표식 되돌리고 SDK 미호출로 종료
      Purchases.purchasePackage()               (settle 시 isPurchaseInFlight=false 후 결과 처리)
    } finally { release }
```

### 4.2 해제 규칙 (D7, D8, D9)

| 경로                                    | active(표식 이후 구매)                     | active(표식 이전 구매)             | inactive                                                                                                  | 조회 실패      |
| --------------------------------------- | ------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------- |
| 구매 SDK 결과(소유자)                   | 해제·완료                                  | 해제·완료                          | uncertain 유지                                                                                            | uncertain 유지 |
| 부트스트랩 / 포그라운드 / 리스너 (자동) | in-flight 아님 ∧ generation 동일일 때 해제 | 유지                               | 유지                                                                                                      | 유지           |
| 사용자 상태 확인 (명시)                 | 해제·완료                                  | 해제·완료 (사용자는 이미 프리미엄) | in-flight 아님 ∧ generation 동일일 때만 해제 → 재구매 허용. in-flight면 유지 + "결제가 아직 진행 중" 안내 | 유지           |

### 4.3 화면 (D2, D7)

배너 판정과 요소별 동작의 정본은 `02-design-brief.md` §States(판정 우선순위 1~6)다. 요약:

- 배너·상태 확인 버튼: `!isPurchasing && (timedOut || uncertain || isPendingTransaction)`. 문구는 timedOut → uncertain → (pending ∧ in-flight: 처리 대기) → (pending: 이전 구매) 순서로 하나만.
- 결제·복원·플랜 비활성: 위 배너 조건 또는 진행 중 작업(구매·복원·상태 확인).
- 닫기·스와이프 차단: `isPurchasing`(저장 대기 포함)·복원·상태 확인 중, 그리고 `uncertain`(NET-03 유지).

### 4.4 권한 판정 원칙 (불변)

권한은 `syncSubscription`의 기존 판정(`entitlements.active[ENTITLEMENT_ID]`)으로만 부여한다. 이번 스펙은 pending 표식의 수명만 다룬다.

### 4.5 늦은 응답

- 구매 중 타임아웃 후 SDK가 늦게 settle하는 경우: 기존 `purchaseAttemptIdRef`/`purchaseResultHandledRef` 유지. in-flight는 settle 시점에만 false가 된다.
- 조기 inactive 후 늦은 승인: 전역 `addCustomerInfoUpdateListener`가 권한을 반영하고(§4.2 자동 해제 규칙으로 표식도 해제), 포그라운드 재조회·수동 확인이 보조 경로다. 사용자가 그 사이 명시 확인으로 표식을 지우고 재구매를 시도하면 App Store가 중복 구독 결제를 막는지는 **검증하지 않았다**(Manual QA).

### 4.6 계정 경계 (D5)

변경 없음.

### 4.7 SDK 동작에 대한 가설 (미검증)

다음은 SDK 네이티브 소스나 실기기 관찰로 확인하지 않은 가설이며, 설계는 이 가설이 **거짓이어도** 안전하도록(inactive로 자동 해제하지 않음) 짜여 있다.

- H1: 강제 종료로 끝나지 않은(unfinished) StoreKit 거래는 다음 실행에서 SDK가 관찰해 RevenueCat에 보고한다.
- H2: 부트스트랩 시점의 `invalidateCustomerInfoCache` + `getCustomerInfo`가 H1의 보고 결과를 이미 반영한다. (반영하지 못하면 조기 inactive가 된다 — §2 C)
- H3: `syncPurchasesForResult()`(`purchases.d.ts:538`)가 H2의 지연을 줄인다. 범위 밖(§7).

## 5. Acceptance Criteria

- AC-1: 이 문서가 실제 코드 아키텍처·결함(D1~D9)·검증되지 않은 가설을 구분해 반영한다.
- AC-2: `handlePurchase`는 표식 저장이 완료된 뒤에만 `Purchases.purchasePackage()`를 호출한다.
- AC-3: 표식 저장·삭제 실패 시 Sentry breadcrumb을 남기되 구매 흐름은 막지 않는다.
- AC-4: 프리미엄 화면은 in-flight가 아닌 pending을 상태 확인 배너·버튼으로 노출하고, pending 동안 구매·복원 버튼을 비활성화한다.
- AC-5: 포그라운드 재조회는 §4.2 자동 해제 규칙으로만 표식을 해제한다.
- AC-6 (D6): 저장 대기 중 화면 닫기가 차단되고, 대기 중 언마운트되면 SDK를 호출하지 않으며 메모리·표식을 되돌린다. 대기 중 중복 탭은 SDK를 추가 호출하지 않는다.
- AC-7 (D7): 구매 in-flight 중 상태 확인이 inactive를 받아도 표식·pending을 지우지 않는다. in-flight 중 "이전 구매" 배너를 표시하지 않는다.
- AC-8 (D8): 자동 경로는 표식 이전에 구매된 entitlement, in-flight 중 결과, 재조회 중 새로 시작된 구매의 pending을 지우지 않는다.
- AC-9 (D9): 부트스트랩은 inactive 결과에서 표식을 유지하고, 이후 명시 확인(성공/inactive/실패) 또는 늦은 리스너 이벤트로 복구된다.

## 6. 검증 계획 / Manual QA Required

자동 검증(단위 테스트, tsc, lint, 시뮬레이터 스크린샷·인터랙션)은 AC별로 수행한다. 다음은 실기기 StoreKit Sandbox 없이는 검증 불가능하며 Pass로 표시하지 않는다.

- [ ] Manual QA Required — 시점 A/B/C 강제 종료 → 재실행 → 배너 노출·자동/수동 해제 동작
- [ ] Manual QA Required — H1/H2 가설(조기 inactive 발생 여부와 지연 시간) 실측
- [ ] Manual QA Required — 명시 확인으로 표식 해제 후 재구매 시 App Store 중복 구독 처리
- [ ] Manual QA Required — 저장 실패 시 Sentry breadcrumb의 실제 전송

## 7. 범위 밖 (Out of Scope)

- RevenueCat App User ID 계정 바인딩(D5).
- `Purchases.syncPurchasesForResult()` 전환(H3).
- pending 상태 백그라운드 폴링/재시도 루프.
