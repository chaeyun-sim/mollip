---
feature-slug: net-03-purchase-before-offline
tier: S
author: john
status: draft
---

# Spec — 구매 버튼을 누르기 직전 연결 단절 (NET-03)

## Problem

상품은 이미 로드된 상태에서 사용자가 "결제하기"를 누른 직후 네트워크가 끊기면, `Purchases.purchasePackage`가 네트워크 오류·보류(pending)·진행중(operation-in-progress) 등 다양한 형태로 실패하거나, 예외 없이 entitlement가 비어 있는 응답을 반환할 수 있다. 이 결과를 "실패"로 단정해 즉시 재구매를 허용하면 실제로는 트랜잭션이 처리 중일 때 중복 결제 위험이 생기고, 반대로 "성공"으로 단정하면 결제 없이 프리미엄을 부여(free entitlement)하는 위험이 생긴다.

## Goals

- 네트워크 오류/타임아웃/보류/진행중/무-entitlement 응답을 모두 "불확실(uncertain)"로 통일 처리하고, 검증된 활성 entitlement 없이는 절대 낙관적으로 프리미엄을 부여하지 않는다.
- uncertain인 동안 구매·복원·닫기/네비게이션을 모두 차단하고, 명시적 "상태 확인" 액션만 허용한다.
- 상태 확인은 CustomerInfo 캐시를 무효화한 뒤 최신 정보를 조회한다. 재연결됐다고 자동으로 재구매하지 않는다.
- 상태 확인 결과 활성 entitlement가 확인되면 정확히 1회 성공 전환한다. 확인 실패(여전히 오프라인 등)는 uncertain을 유지한다. 확인은 성공했지만 entitlement가 없는, "명확히 reconcile된" 경우에만 재시도 가능한 상태로 되돌린다.
- 사용자 취소(cancel)는 uncertain으로 만들지 않고 안전하게 즉시 재시도를 허용한다.
- `purchasePackage` 자체에는 타임아웃을 걸지 않는다(네이티브 트랜잭션 중복 실행 방지).

## Constraints

- NET-01에서 이미 구현된 uncertain 상태 기계(`purchaseStatus`, `handleCheckPendingStatus`, `classifyPurchaseError`)를 우선 검토하고, 실제 결함만 최소 diff로 수정한다.
- 실 네트워크 단절·실 Apple StoreKit 검증은 이 세션에서 재현하지 않는다.

## Non-goals (out of scope)

- 상품 로딩 단계의 레이스(NET-02에서 이미 다룸).
- Android.

## Users & context

- 결제 버튼을 누르는 순간 네트워크가 불안정한 사용자.

## Acceptance criteria

### AC-1: 결제 중 오류가 모두 uncertain으로 통일 처리된다

- **Given** 상품이 선택된 상태에서 결제 버튼을 누른다
- **When** `purchasePackage`가 NETWORK_ERROR/OFFLINE_CONNECTION_ERROR/PRODUCT_REQUEST_TIMED_OUT_ERROR/PAYMENT_PENDING_ERROR/OPERATION_ALREADY_IN_PROGRESS_ERROR로 거부되거나, 예외 없이 entitlement가 비어 있는 CustomerInfo로 resolve된다
- **Then** `purchaseStatus`가 `uncertain`으로 전이하고, store(`useSubscriptionStore`)는 절대 프리미엄으로 표시되지 않는다.

### AC-2: uncertain인 동안 구매·복원·닫기가 모두 차단된다

- **Given** `purchaseStatus === 'uncertain'`이다
- **When** 사용자가 결제 버튼, 복원 버튼, 닫기(X) 버튼 또는 스와이프 뒤로가기를 시도한다
- **Then** 모두 무시되거나 비활성 상태로 렌더링되며, `Purchases.purchasePackage`/`restorePurchases`가 다시 호출되지 않는다.

### AC-3: 상태 확인은 캐시 무효화 후 재조회하며 결과에 따라 정확히 분기한다

- **Given** uncertain 상태에서 "상태 확인"을 누른다
- **When** `invalidateCustomerInfoCache` → `getCustomerInfo`가 실행된다
- **Then** 활성 entitlement 확인 시 정확히 1회 성공 전환(잠금+이동+토스트)하고, 확인 자체가 실패하면 uncertain을 유지하며, 확인은 성공했지만 entitlement가 없으면 idle로 돌아가 재시도를 허용한다.

### AC-4: 취소는 안전하게 즉시 재시도 가능하다

- **Given** 결제 버튼을 눌렀다가 사용자가 취소한다
- **When** `userCancelled` 또는 `PURCHASE_CANCELLED_ERROR`가 반환된다
- **Then** `purchaseStatus`는 `idle`로 남고, 토스트 없이 즉시 재구매를 시도할 수 있다.

## Screens / routes

| Route                             | 변경                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `app/settings/premium.tsx`        | `isCloseDisabled`에 `isUncertain` 포함(닫기/스와이프 차단 누락 수정)            |
| `src/hooks/usePremiumPurchase.ts` | `handleRestore`에 `purchaseStatus === 'uncertain'` 훅 레벨 가드 추가(방어 심화) |

## Risks & dependencies

- 실 네트워크 단절 재현 불가 — jest의 controlled-promise/mock 에러코드로 대체.

## Open questions (for Manager → user)

- (none)

## Feature breakdown (for Chris)

1. AC-1 — 기존 `classifyPurchaseError` + uncertain 전이 로직 재검증(이미 구현됨 확인), OPERATION_ALREADY_IN_PROGRESS 케이스 테스트 추가
2. AC-2 — **결함 발견 및 수정**: 닫기 버튼이 uncertain 상태를 반영하지 않던 문제 수정
3. AC-3 — 기존 `handleCheckPendingStatus` 재검증(이미 구현됨 확인)
4. AC-4 — 기존 취소 처리 재검증(이미 구현됨 확인)
