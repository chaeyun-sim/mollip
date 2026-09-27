---
feature-slug: net-02-offerings-interruption
tier: S
author: john
status: draft
---

# Spec — 상품 조회 중 연결 단절 (NET-02)

## Problem

프리미엄 화면 진입 후 상품(offerings) 응답을 기다리는 도중 네트워크가 끊기면, 타임아웃된 요청(request #1)의 실제 네이티브 promise가 나중에 뒤늦게 성공/실패로 도착할 수 있다. 이 지연 응답이 그 사이 사용자가 누른 재시도(request #2)의 최신 결과를 덮어쓰면 안 되고, 로딩/버튼 상태가 영구히 멈추거나 잘못된 상품으로 결제가 진행돼서는 안 된다.

## Goals

- request #1(구 요청)의 지연 성공/실패가 request #2(신 요청)의 상태를 절대 덮어쓰지 않는다.
- 부분 상품 응답에서 존재하지 않는 플랜을 활성화하거나 다른 상품으로 대체하지 않는다.
- 타임아웃 이후 재시도가 항상 가능하고, loading/error/버튼 상태가 고착되지 않는다.
- 동일 틱 연타로 인한 중복 SDK 호출을 방지한다.
- 상품이 없거나 로딩 중일 때 구매 SDK가 절대 호출되지 않는다.

## Constraints

- NET-01에서 구현한 `usePremiumPurchase`의 기존 동작(`requestIdRef`, `loadInFlightRef`, `isMountedRef`, bounded timeout)을 우선 검토하고, 실제 결함이 확인된 경우에만 최소 diff로 수정한다.
- 실 네트워크 단절(airplane mode)·실 Apple StoreKit 검증은 이 세션에서 재현하지 않는다 — jest로 대체 검증하고 그렇게 명시한다.

## Non-goals (out of scope)

- NET-01에서 이미 다룬 구매 성공/취소/보류(uncertain) 상태 기계 자체의 재설계.
- Android 플로우.

## Users & context

- 상품 로딩 중 네트워크가 불안정한 사용자(지하철, 엘리베이터 등).

## Acceptance criteria

### AC-1: 지연된 구 요청의 성공이 신 요청의 실패를 덮어쓰지 않는다

- **Given** request #1이 타임아웃으로 error 처리된 뒤, 재시도(request #2)도 실패했다
- **When** request #1의 원래 네이티브 호출이 뒤늦게 "성공"으로 도착한다
- **Then** 화면은 계속 error 상태를 유지하고 상품 목록은 비어 있다.

### AC-2: 지연된 구 요청의 실패가 신 요청의 성공을 덮어쓰지 않는다

- **Given** request #1이 타임아웃으로 error 처리된 뒤, 재시도(request #2)가 성공했다
- **When** request #1의 원래 네이티브 호출이 뒤늦게 "실패"로 도착한다
- **Then** 화면은 계속 ready 상태와 request #2가 가져온 정확한 상품 목록을 유지한다.

### AC-3: loading/부분상품/무상품에서 구매 SDK 호출 금지

- **Given** 상품 로딩이 진행 중이거나, 유효한 선택 상품이 없다
- **When** 결제 버튼이 눌린다(비활성화 상태를 우회해서라도)
- **Then** `Purchases.purchasePackage`는 절대 호출되지 않는다.

### AC-4: 재시도 연타 시 중복 호출 방지

- **Given** error 상태에서 재시도 버튼이 동일 틱에 여러 번 눌린다
- **When** `loadOfferings`가 중복 호출된다
- **Then** 실제 `Purchases.getOfferings` 호출은 한 번만 발생한다.

## Screens / routes

| Route                                                          | 변경                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app/settings/premium.tsx` / `src/hooks/usePremiumPurchase.ts` | 검토 후 필요 시 최소 수정(실제로는 코드 변경 없이 테스트로 검증 완료 — §04 참고) |

## Risks & dependencies

- 실 네트워크 단절 재현 불가 — jest의 controlled-promise 기법으로 대체.

## Open questions (for Manager → user)

- (none)

## Feature breakdown (for Chris)

1. AC-1, AC-2 — 기존 `requestIdRef` 가드 재검증, 크로스 레이스 테스트 추가
2. AC-3 — 기존 가드(`loadState !== 'ready'`, `!selectedPackage`) 재검증, 명시적 테스트 추가
3. AC-4 — 기존 `loadInFlightRef` 가드 재검증, 동일 틱 연타 테스트 추가
