---
feature-slug: net-01-purchase-recovery
author: manager
status: ready-for-user
---

# Handoff to user — NET-01

## Summary

프리미엄 구매 화면의 상품 로딩·구매 성공/실패 처리를 전면 재작성했다. 오프라인·상품없음·부분상품·네트워크실패·보류(불확실) 트랜잭션을 각각 구분해 처리하며, 구매 성공 시 루트 소유 오버레이로 전환을 보호한다. 실제 RevenueCat SDK(Test Store 모드)로 시뮬레이터에서 종단 검증했다.

## What changed

- `src/hooks/usePremiumPurchase.ts` (신규): 상품 로딩(bounded wait, dedup, unmount 무효화, 가격 유효성 필터), 구매/복원/상태확인 상태 기계, 동시성 가드, uncertain(불확실) 상태 및 명시적 reconcile
- `app/settings/premium.tsx` (재작성): 로딩/에러/불확실 UI, 닫기·제스처 busy 비활성화, 실가격만 렌더링
- `src/store/purchaseLockStore.ts`, `src/components/settings/PurchaseLockOverlay.tsx` (신규): 루트 전역 구매완료 전환 잠금(네이티브 Modal 기반 — 중첩 스택 제스처까지 차단)
- `src/lib/purchasePricing.ts`, `src/lib/purchaseErrors.ts` (신규): 일일환산가/할인율(통화 일치 검증 포함), SDK 에러코드 분류
- `app/_layout.tsx`: `PurchaseLockOverlay` 마운트 + 잠금 시 루트 제스처 비활성화 (기존 강제 업데이트 로직 보존)
- `package.json`: jest `transformIgnorePatterns`에 `@revenuecat` 계열 ESM 패키지 추가(테스트 인프라 전용 변경)

## Evidence

| Feature / AC                   | tsc | Screenshot                                       | Interaction         | Regression                                 |
| ------------------------------ | --- | ------------------------------------------------ | ------------------- | ------------------------------------------ |
| AC-1 오프라인/에러             | ✅  | jest 대체                                        | jest 대체           | —                                          |
| AC-2 부분/빈상품, 실가격만     | ✅  | `22-premium-open.png` (US$ 실가격, 76% 동적할인) | ✅                  | —                                          |
| AC-3 성공 전환/잠금/토스트     | ✅  | `25-during-lock.png` (Premium 배너+토스트)       | ✅ 실제 탭으로 확인 | `26-regression-exhibitions.png`(터치 정상) |
| AC-4 취소/네트워크/보류 불확실 | ✅  | jest 대체                                        | jest 대체           | —                                          |
| AC-5 동시성 가드               | ✅  | —                                                | jest 대체(6 tests)  | —                                          |

전체 tsc/jest 원본 결과는 `05-qa-report.md` §Evidence 참고 (tsc exit 0, jest 30 suites/305 tests 모두 통과, real exit code).

## Design QA

- Alex (Design QA) verdict: Pass @ iteration 1 (`03-design-review.md`, overall 4.0/5)

## Open questions

- (none)

## 남은 블로커 (명시적 미완료)

1. **실제 Apple StoreKit 미검증**: 이 세션의 RevenueCat API 키는 Test Store용이라 실제 App Store 결제창(Sandbox)을 띄우지 못했다. 실기기 + Sandbox Apple ID + 운영 Apple API 키로 별도 검증이 필요하다.
2. 세션 중 확인된 동시성 이슈: 작업 중 다른 프로세스(사용자 또는 별도 에이전트로 추정)가 `rm -rf node_modules && npm install`을 병렬로 실행해 Metro 캐시가 깨졌다 — Metro를 캐시 초기화로 재시작해 복구했다(`-c` 플래그). 코드 변경과는 무관하지만, 동시 작업 시 참고 바란다.

## User feedback

### UX feedback

-

### Evidence

-

### Triage

- [ ] Design → Design Agent
- [ ] Dev → Dev Agent
- [ ] Spec → Manager Agent
- [ ] No change required

---

**확인 요청**

위 내용과 스크린샷(`/tmp/qa-screens/`) 기준으로 동작을 한 번 봐 주세요. 특히 §남은 블로커 2건(orphan 파일 삭제, 실 StoreKit 검증)은 제가 이 세션에서 완결하지 못했습니다. OK면 commit/push 지시를 주시면 됩니다. 수정 원하시면 구체적으로 알려 주세요.
