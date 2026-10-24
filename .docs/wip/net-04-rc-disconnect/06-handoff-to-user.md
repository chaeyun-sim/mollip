---
feature: NET-04 RevenueCat 통신 단절 후 구매 결과 복구
status: ready
---

NET-04 구현과 자동 검증을 완료했다. Apple 결제 후 RevenueCat이 단절돼도 SDK가 유효한 active entitlement를 반환하면 즉시 반영하고, 확인되지 않은 경우에는 재구매를 막은 채 지정 문구를 표시한다. RevenueCat 복구 후 상태 확인 또는 앱 재진입으로 동일 거래의 권한을 재조회한다.
