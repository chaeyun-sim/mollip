---
feature: NET-06 장시간 타임아웃 후 늦은 성공 응답
status: complete
---

- 구매 SDK 요청과 화면 대기 제한을 분리했다. 대기 제한은 15초이며 SDK promise는 계속 감시한다.
- 전역 `purchaseTransactionStore`로 화면 unmount 이후에도 pending 거래를 재구매 방지 상태로 유지한다.
- 늦은 active CustomerInfo는 mounted 여부와 관계없이 `syncSubscription`으로 반영한다.
- explicit 상태 확인에서 active entitlement가 없으면 pending을 해제해 재시도할 수 있게 했다.
