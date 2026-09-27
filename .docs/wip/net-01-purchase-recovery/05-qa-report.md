---
feature-slug: net-01-purchase-recovery
author: taylor
status: complete-with-noted-blocker
---

# QA report — NET-01

## Summary

- P0: 0 (남은 ship blocker 없음)
- Tier: M
- Date: 2026-09-22
- **정직성 노트**: 구현이 Sam/Alex 게이트보다 먼저 시작된 provisional 코드였다. 이 QA는 세션 후반부에 실제 시뮬레이터·jest·tsc로 재검증한 결과다. 실제 Apple StoreKit(프로덕션 API 키 + Sandbox Apple ID)은 이 환경에서 검증 불가능했다 — 아래 "블로커" 절 참고.

## QA checks

- Q1: TypeScript compilation — `npx tsc --noEmit` exit 0
- Q2: Automated tests — `npx jest` exit 0, 30 suites / 305 tests pass
- Q3: Functional correctness — 시뮬레이터에서 실제 RevenueCat SDK 왕복(Test Store)으로 검증
- Q4: UX — 로딩/에러/불확실 상태 전환, 닫기·제스처 비활성화
- Q5: Convention — import 그룹핑, 화살표 함수, common/ 도메인 분리
- Q6: Visual fidelity — 스크린샷으로 실제 렌더 확인(가격·할인율 실데이터)
- Q7: Interaction — 실제 탭으로 구매 플로우 종단 실행
- Q8: Regression — 마이페이지 구독 배너, 하단 탭 터치 반응성 확인
- Q9: Performance — 해당 없음(신규 무거운 연산 없음)

## AC matrix

| AC                                | Q1 tsc | Q2 jest                                          | Q3 bug | Q4 UX | Q5 conv | Q6 visual                                                                                | Q7 interact                                          | Q8 regress                           | Q9 perf |
| --------------------------------- | ------ | ------------------------------------------------ | ------ | ----- | ------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------ | ------- |
| AC-1 (오프라인/에러)              | ✅     | ✅ (9 tests)                                     | ✅     | ✅    | ✅      | ⚠️ 시뮬레이터 온라인이라 실기기 오프라인 미재현, jest로 대체 검증                        | ⚠️ jest로 대체                                       | N/A                                  | N/A     |
| AC-2 (부분/빈 상품·가짜가격 금지) | ✅     | ✅ (3 tests)                                     | ✅     | ✅    | ✅      | ✅ 실제 US$ 가격·76% 할인 배지 스크린샷 확인                                             | ✅                                                   | N/A                                  | N/A     |
| AC-3 (성공 전환/잠금/토스트)      | ✅     | ✅ (4 tests)                                     | ✅     | ✅    | ✅      | ✅ 스크린샷: 화면 닫힘→마이페이지 "Premium 이용 중"→토스트 "몰립 프리미엄이 시작됐어요!" | ✅ 실제 탭으로 종단 확인                             | ✅ 이후 탭 터치 정상(잠금 잔존 없음) | N/A     |
| AC-4 (취소/네트워크/보류 불확실)  | ✅     | ✅ (5 tests + 4 상태확인 tests)                  | ✅     | ✅    | ✅      | ⚠️ 실 네트워크 단절 재현 불가 — jest로 대체 검증(SDK 실제 에러코드 enum 사용)            | ⚠️ jest로 대체                                       | N/A                                  | N/A     |
| AC-5 (동시성 가드)                | ✅     | ✅ (6 tests: 구매/복원/상태확인 각 동일 틱 중복) | ✅     | N/A   | ✅      | N/A                                                                                      | ⚠️ jest로 대체(동일 틱 연타는 수동 탭으로 재현 곤란) | N/A                                  | N/A     |

## Findings

### P0 (ship blocker)

- (없음)

### P1

- (없음)

### P2

- RevenueCat `InteractionManager` 사용 시 RN 런타임이 "InteractionManager has been deprecated" 경고를 로그에 남긴다(RN 자체 경고, 본 기능 신규 도입 아님 — 기존 코드베이스 관례를 그대로 따름). `completePurchaseAndClose`의 bounded failsafe 타이머가 이 API의 향후 제거/불안정성에 대한 안전망 역할을 하므로 즉시 조치는 불필요하나, RN이 실제로 API를 제거하는 시점에 대체 필요.

## Evidence

| ID  | Path                                            | Description                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `/tmp/qa-screens/22-premium-open.png`           | 실제 RevenueCat 상품 로딩 성공 — US$24.99/US$3.99/US$9.99 실가격, 76% 할인 동적 계산, 하드코딩 가격 없음                                                                                                                                                               |
| E2  | `/tmp/qa-screens/24-purchase-attempt2.png`      | 결제하기 탭 → RevenueCat Test Store 구매 시트("Test valid purchase"/"Test failed purchase") — 실제 SDK 왕복                                                                                                                                                            |
| E3  | `/tmp/qa-screens/25-during-lock.png`            | 구매 성공 후: 화면 닫힘 + 마이페이지 "Premium 이용 중" 배너 + 완료 토스트 "몰립 프리미엄이 시작됐어요!" (정확히 1회)                                                                                                                                                   |
| E4  | `/tmp/qa-screens/26-regression-exhibitions.png` | 완료 후 하단 탭 터치가 여전히 반응(pull-to-refresh 트리거) — 잠금 잔존 없음                                                                                                                                                                                            |
| E5  | `/tmp/metro-restart.log`                        | Metro/RevenueCat 콘솔 로그 — `💰 Purchasing Product '6months'` → `PostReceiptDataOperation (200)` → `💰 Finishing transaction` 순서로 정확히 1회씩 발생                                                                                                                |
| E6  | `npx tsc --noEmit` (exit 0)                     | 타입 오류 0건                                                                                                                                                                                                                                                          |
| E7  | `npx jest` (exit 0, 30 suites / 305 tests)      | `src/hooks/__tests__/usePremiumPurchase.test.tsx`(27 tests: dedup/timeout/race/unmount/동시성/uncertain/reconcile/복원), `src/lib/__tests__/purchasePricing.test.ts`, `src/lib/__tests__/purchaseErrors.test.ts`, `src/store/__tests__/purchaseLockStore.test.ts` 포함 |

## Regression paths walked

1. 마이페이지 → 프리미엄으로 업그레이드 → (구매 성공) → 마이페이지 복귀, "Premium 이용 중" 배너 확인
2. 구매 완료 직후 하단 탭 터치 반응성 확인(잠금 오버레이 잔존 없음)
3. 둘러보기 탭 캐러셀 자동 회전 등 기존 홈 화면 동작 영향 없음 확인(스크린샷 비교)

## Return reason

- (해당 없음 — Chris 반려 없음)

## Recommendation

- [x] Ready for Manager handoff (블로커 항목은 §06에 명시)
- [ ] Return to Chris (Dev)

## 블로커 — 구조적 환경 제약 (정직성 필수 기재)

**실제 Apple StoreKit(Sandbox) 결제는 이 세션 환경에서 검증하지 못했다.**

- 정확한 시도: `app/settings/premium.tsx`에서 "결제하기"를 실제로 탭했고, `Purchases.purchasePackage()`가 정상 호출됐다(Metro 로그로 확인). 그러나 응답한 것은 RevenueCat **Test Store**였다 — 앱에 표시된 다이얼로그 원문: _"This is a test purchase and should only be used during development. In production, use an Apple API key from RevenueCat."_
- 원인: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`(`.env.local`, 값 미확인/비공개)가 RevenueCat Test Store용 키로 설정돼 있다. 실제 Apple StoreKit 연동을 검증하려면 (1) RevenueCat 대시보드에서 발급한 Apple API 키로 교체, (2) 실기기 또는 iOS 17+ 시뮬레이터의 StoreKit Configuration/Sandbox Apple ID 로그인이 필요하다 — 둘 다 이 세션에서 조작할 수 있는 자격증명이 아니다.
- 영향 범위: `Purchases.purchasePackage/getCustomerInfo/restorePurchases/invalidateCustomerInfoCache` 호출 자체와 응답 처리(엔타이틀먼트 확인, `syncSubscription`, 상태 전이)는 RevenueCat 백엔드와 실제로 왕복하며 검증됐다. 검증되지 않은 것은 "iOS 결제창에서 실제로 카드가 청구되는" StoreKit 네이티브 레이어 자체다.
- **가짜 통과를 만들지 않기 위해**: 이 QA report는 Test Store 결과를 "실제 StoreKit 성공"이라고 주장하지 않는다. AC-3(성공 전환)는 Test Store 응답 기준으로 Pass 처리했고, 실 결제 검증은 별도 태스크(운영 RevenueCat API 키 발급 + 실기기 Sandbox 계정)로 분리해 사용자에게 안내한다.
