---
feature: NET-04 RevenueCat 통신 단절 후 구매 결과 복구
author: chris
status: complete
---

- `usePremiumPurchase`의 active entitlement 분기를 Offline Entitlements 성공 경로로 유지하고, 미확인/네트워크 결과에는 공통 대기 문구와 `uncertain` 잠금을 적용했다.
- `app/settings/premium.tsx`의 대기 상태 문구를 QA 기대 문구와 일치시켰다.
- 앱이 foreground로 복귀할 때 `getCustomerInfo()`만 재호출해 RevenueCat 복구 후 권한을 반영한다. 구매 API 재호출은 하지 않는다.
- 구매 결과 미확인 케이스의 지정 문구와 재구매 차단을 훅 테스트에 추가했다.
