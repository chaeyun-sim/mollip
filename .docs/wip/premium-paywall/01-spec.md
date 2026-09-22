---
feature-slug: premium-paywall
tier: L
author: john
status: pass
---

# Spec — 몰립 프리미엄 결제 화면

## Problem

- 구독 진입점은 준비중이며 상품 가치를 비교할 화면이 없다.

## Goals

- 주간 상품을 우선 제시하고 3일 체험, 갱신 금액, 기간을 명확히 표시한다.
- 1일 이용권과 월간 구독을 혼동하지 않도록 구분한다.
- 결제 연결 전 실제 구매가 가능한 것처럼 보이지 않게 한다.

## Constraints

- Apple 자동 갱신 상품 기간은 주간/월간. 1일은 별도 이용권.
- 실제 StoreKit/RevenueCat 상품 설정 및 체험 자격 확인 전에는 결제 실행 금지.
- 기존 작업 중 변경을 보존한다.

## Non-goals (out of scope)

- App Store Connect 상품 생성, RevenueCat 키 설정, 실제 결제·복원.
- 구독 권한 부여 및 서버 영수증 검증.

## Acceptance criteria

### AC-1: 가격 비교 (2026-09-21 개정 — `01-spec-amendment-memo.md` 참고)

- **Given** 사용자가 설정의 프리미엄 배너를 누르면
- **When** 결제 화면이 열리면
- **Then** 6개월 ₩34,900/6개월(26% 할인 배지), 1주 ₩3,900/주, 1개월 ₩7,900/월이 표시되고 6개월이 기본 선택된다.

### AC-2: 조건 및 안전한 동작

- **Given** 상품 중 하나를 선택하면
- **When** 결제 영역을 확인하면
- **Then** 해당 상품의 전체 청구 금액과 기간을 확인할 수 있고 결제 준비중 상태가 명확하다. 주간 체험은 3일과 이후 갱신 금액을 함께 표시한다.

## Screens / routes

| Route               | 변경               |
| ------------------- | ------------------ |
| `/settings/premium` | 신규 결제 화면     |
| `/(tabs)/settings`  | 프리미엄 배너 연결 |

## Risks & dependencies

- 실제 상품 가격·체험 자격은 StoreKit에서 조회한 값으로 교체해야 한다.
- 1일 이용권 권한 만료 설계가 필요하다.

## Open questions (for Manager → user)

- 실제 상품 등록 후 1일 이용권의 구매 유형과 무료 체험 대상 상품 확정.

## Feature breakdown (for Chris)

1. AC-1 화면과 진입점.
2. AC-2 선택 상태와 조건 문구.
