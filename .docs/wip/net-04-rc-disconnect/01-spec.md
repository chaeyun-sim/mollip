---
feature: NET-04 RevenueCat 통신 단절 후 구매 결과 복구
tier: S
status: implemented
---

## Acceptance Criteria

- Given Apple 결제 승인은 완료됐고 RevenueCat 서버가 일시적으로 차단된 상태 When SDK가 active entitlement를 반환하면 Then 해당 entitlement만으로 권한을 반영하고 성공 처리를 한 번만 수행한다.
- Given 구매 결과에 active entitlement가 없거나 RevenueCat 네트워크 오류가 발생한 상태 When 구매 요청이 끝나면 Then 권한을 지급하지 않고 `구매 결과를 확인하고 있어요. 다시 구매하지 말고 잠시 후 상태를 확인해 주세요.`를 표시하며 재구매를 잠근다.
- Given RevenueCat 연결이 복구된 상태 When 상태 확인 또는 앱 foreground 재진입이 발생하면 Then CustomerInfo를 재조회해 active entitlement가 확인될 때만 권한을 반영한다.
- Given 결과가 확인되지 않은 상태 When 사용자가 구매 버튼을 다시 누르면 Then RevenueCat 구매 API를 재호출하지 않는다.

## Out of scope

- RevenueCat 대시보드의 Offline Entitlements 설정 변경
- Apple Sandbox 결제 환경 자체의 자동화
