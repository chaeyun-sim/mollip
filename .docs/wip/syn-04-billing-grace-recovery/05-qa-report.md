---
feature-slug: syn-04-billing-grace-recovery
author: taylor
status: complete-with-sandbox-blocker
---

# QA report

## 구현

- `billingIssueDetectedAt`를 subscription store에 저장한다.
- `syncSubscription`은 active entitlement만 `isPremium=true`로 설정한다.
- inactive entitlement의 결제 문제 정보도 보존해 안내를 표시할 수 있다.
- Premium 배너에 `구독 갱신에 문제가 있어요. 결제 정보를 확인해 주세요.`를 표시한다.

## Evidence

| AC                            | tsc       | Jest | Visual/interaction | Regression    |
| ----------------------------- | --------- | ---- | ------------------ | ------------- |
| Active + billing issue 유지   | ✅ exit 0 | ✅   | 코드·스토어 테스트 | ✅ 전체 suite |
| Inactive + billing issue 차단 | ✅        | ✅   | 코드·스토어 테스트 | ✅ 전체 suite |
| Recovery clears warning       | ✅        | ✅   | 코드·스토어 테스트 | ✅ 전체 suite |
| willRenew=false active 유지   | ✅        | ✅   | 코드·스토어 테스트 | ✅ 전체 suite |

- `npx tsc --noEmit` exit 0
- `npm test -- --runInBand --silent` exit 0
- 31 suites / 316 tests passed

## Blocker

Sandbox에서 갱신 실패·grace 활성/비활성 설정을 실제 Apple StoreKit으로 재현하지 못했다. RevenueCat Test Store/Sandbox 자격증명과 App Store Connect 설정이 필요하다. 따라서 grace 기간의 실제 시간 경계는 테스트로 주장하지 않는다. StoreKit 설정 후 active entitlement와 `billingIssueDetectedAt` 조합을 실기기에서 재검증해야 한다.
