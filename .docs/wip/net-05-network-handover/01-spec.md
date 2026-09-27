---
feature: NET-05 Wi-Fi/LTE·5G 반복 전환 중 구매 일관성
tier: S
status: implemented
---

## Acceptance Criteria

- 하나의 구매 시도에서 `purchasePackage` 호출은 한 번만 발생한다.
- 연결 전환 중 늦은 응답은 현재 구매 시도를 덮어쓰지 않는다.
- active entitlement가 확인되면 권한 반영, 화면 이동, 성공 안내는 각각 한 번만 실행된다.
- 결과가 확인되지 않으면 재구매를 막고 상태 확인으로만 복구한다.
