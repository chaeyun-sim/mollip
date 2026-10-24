---
feature-slug: syn-04-billing-grace-recovery
tier: M
author: john
status: complete
---

# SYN-04 — 갱신 실패·Billing Grace Period·복구

## Acceptance criteria

- RevenueCat entitlement가 active이고 `billingIssueDetectedAt`가 있으면 권한을 유지하고 `구독 갱신에 문제가 있어요. 결제 정보를 확인해 주세요.`를 표시한다.
- entitlement가 inactive/없으면 결제 문제 정보를 보존하되 프리미엄 권한은 지급하지 않는다.
- 결제 회복 후 최신 CustomerInfo에서 active entitlement가 확인되면 경고를 제거하고 권한을 복구한다.
- `willRenew`나 billing issue 시각만으로 권한을 계산하거나 grace 기간을 임의 연장하지 않는다.

## Source semantics

Apple Billing Retry와 Billing Grace Period는 별도 상태다. Apple의 StoreKit은 `isInBillingRetry`와 `gracePeriodExpirationDate`를 별도로 제공하며, RevenueCat은 active entitlement와 `billingIssueDetectedAt`를 분리해 노출한다.

- https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions
- https://developer.apple.com/documentation/StoreKit/Product/SubscriptionInfo/RenewalInfo/gracePeriodExpirationDate
- https://www.revenuecat.com/docs/customers/customer-info
