---
feature-slug: net-01-purchase-recovery
tier: M
author: john
status: draft
---

> **정직성 노트 (Manager)**: 이 기능은 세션 초반에 구현이 먼저 진행된 뒤(provisional code), 사용자의 지적으로 워크플로 게이트가 소급 적용되고 있다. `.docs/wip/net-01-purchase-recovery/`가 애초에 없는 상태로 구현이 시작된 것은 AGENTS.md 워크플로 위반이다. 이 spec은 이미 작성된 코드를 기준으로 사후에 요구사항을 문서화하고, 이어지는 Sam/Alex/Taylor 단계에서 실제로 코드를 재검증하기 위해 작성한다.

# Spec — 프리미엄 구매 오프라인 복구 및 구매 완료 전환 (NET-01)

## Problem

`app/settings/premium.tsx`가 RevenueCat 상품(offerings)을 불러오지 못하는 상황(오프라인, 상품 없음, 부분 상품)을 제대로 처리하지 못했다: 로딩 실패 시 재시도 UI가 없고, 하드코딩된 `PLANS` fallback 가격을 보여주며, 유효하지 않은 상품으로도 구매 SDK를 호출할 수 있는 구조였다. 또한 구매 성공/실패/불확실(네트워크 오류·결제 보류) 처리가 명확한 상태 기계 없이 catch-only toast로만 처리되어, 실제로 결제됐는지 알 수 없는 상황에서도 재구매 버튼이 즉시 다시 눌리는 문제가 있었다.

## Goals

- 상품 로딩: loading/error/ready 상태 기계, bounded wait(타임아웃), 재시도, 요청 dedup/stale 응답 보호, unmount 이후 응답 무시.
- 지원 플랜만 필터링하고 유효한 선택을 보장하며, 가격은 항상 RevenueCat이 반환한 실제 값만 사용한다(하드코딩/빈 값/가짜 할인율 금지).
- 구매 성공: 검증된 활성 entitlement 확인 후에만 화면을 닫고, 전환 중에는 루트 소유의 차단 오버레이(ActivityIndicator)를 보여준 뒤, 잠금을 풀며 완료 토스트를 정확히 1회 띄운다.
- 구매 중 네트워크 실패/취소/보류(불확실한 트랜잭션)를 SDK가 제공하는 에러 코드로 구분하고, 결과가 불확실하면 자동 재구매를 절대 하지 않으며 명시적인 "상태 확인" 액션으로만 CustomerInfo를 재조회(reconcile)한다.
- 동시성 보호: 동일 틱 중복 탭, 구매/복원 동시 진행, 로딩 재시도 중복 호출을 모두 막는다.

## Constraints

- `react-native-purchases` 설치 버전(10.10.0)의 실제 타입/에러 코드 정의만 사용한다(추측 금지).
- 구매 타임아웃으로 네이티브 트랜잭션을 중복 시작하지 않는다 — 타임아웃은 상품 로딩에만 적용한다.
- 기존 dirty 파일(`app/_layout.tsx`의 강제 업데이트 게이트, package 관련 파일)을 보존한다.

## Non-goals (out of scope)

- Android 결제 플로우(현재 RevenueCat iOS API 키만 설정됨).
- 프로모션 오퍼/인트로 가격 UI.

## Users & context

- 프리미엄 구독을 시도하는 모든 사용자. 특히 오프라인/저신호 환경에서 앱을 처음 여는 사용자(fresh install, no cache).

## Acceptance criteria

### AC-1: 오프라인 상태에서 상품 로딩 실패 및 복구

- **Given** 상품/구독 캐시가 없는 상태에서 네트워크가 꺼져 있다
- **When** 프리미엄 화면에 진입한다
- **Then** 정확한 문구 `'상품 정보를 불러오지 못했어요. 연결 후 다시 시도해 주세요.'`가 표시되고, 구매 버튼은 비활성화되며 구매 SDK는 절대 호출되지 않는다. 네트워크 복구 후 같은 화면에서 "다시 시도"로 재설치 없이 복구된다.

### AC-2: 상품 없음/부분 상품

- **Given** offerings는 응답했지만 `availablePackages`가 비어 있거나 일부 플랜만 존재한다
- **When** 화면이 로드된다
- **Then** 존재하지 않는 플랜은 하드코딩된 가격으로 대체 표시되지 않고 목록에서 제외되며, 선택된 플랜은 실제 존재하는 상품으로 자동 대체된다. 가격이 없는 상품(빈 `priceString`)도 목록에서 제외된다.

### AC-3: 구매 성공 — 전환·잠금·완료 알림

- **Given** 유효한 상품이 선택돼 있다
- **When** 구매가 성공하고 활성 entitlement가 확인된다
- **Then** 화면이 닫히고, 전환이 끝날 때까지 루트 소유의 차단 오버레이(ActivityIndicator)가 터치/뒤로가기/제스처를 모두 막으며, 전환 완료 후 잠금이 해제되고 완료 토스트가 정확히 1회 뜬다. premium 화면이 unmount돼도 오버레이 생애주기는 유지된다.

### AC-4: 구매 중 네트워크 실패/취소/보류

- **Given** 구매 SDK 호출 중 오류가 발생한다
- **When** 취소/네트워크 오류/결제 보류를 SDK 에러 코드로 구분한다
- **Then** 취소는 조용히 무시하고 즉시 재시도를 허용한다. 네트워크 오류·결제 보류는 "성공/실패 불확실" 상태로 전이해 자동 재구매를 막고, 사용자가 명시적으로 누르는 "상태 확인" 액션에서만 캐시를 무효화한 뒤 CustomerInfo를 재조회해 결과를 확정한다.

### AC-5: 동시성 가드

- **Given** 사용자가 버튼을 연타하거나 구매/복원을 동시에 시도한다
- **When** 동일 틱에 중복 호출되거나 다른 작업이 진행 중이다
- **Then** 구매/복원/상태확인/상품로딩 SDK 호출은 각각 한 번만 실행된다.

## Screens / routes

| Route                      | 변경                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `app/settings/premium.tsx` | 로딩/에러/불확실 상태 UI, 재시도, 상태확인 버튼, 닫기/제스처 비활성화 |
| `app/_layout.tsx`          | `PurchaseLockOverlay` 루트 마운트, 강제 업데이트 로직 보존            |

## Risks & dependencies

- 실제 StoreKit 결제 테스트는 Sandbox Apple ID·기기 서명이 필요해 이 세션 환경에서 불가능할 수 있음(§05-qa-report 블로커 참고).
- RevenueCat 에러 코드 매핑은 설치된 SDK 버전에 종속적 — 버전 업그레이드 시 재검증 필요.

## Open questions (for Manager → user)

- (none — 사용자가 이미 상세 요구사항을 직접 제공함)

## Feature breakdown (for Chris)

1. AC-1, AC-2 — `usePremiumPurchase` 상품 로딩 상태 기계 (완료, provisional → 본 세션에서 재검증)
2. AC-3 — `PurchaseLockOverlay` + `completePurchaseAndClose` (완료, 본 세션에서 Modal 기반으로 보강)
3. AC-4 — uncertain 상태 기계 + `handleCheckPendingStatus` (완료, 본 세션에서 신규 추가)
4. AC-5 — 동기 ref 가드 (완료, 본 세션에서 신규 추가)
