---
feature: USR-01 구매 버튼 연타
tier: S
status: implemented
---

## Acceptance Criteria

- 1초 내 10회 탭에서도 `purchasePackage` 호출은 1회다.
- 구매 처리 중 추가 탭은 SDK를 호출하지 않는다.
- 사용자 취소 후 진행 상태와 pending 거래가 해제되어 재구매할 수 있다.
- 복원과 구매가 동시에 실행되지 않는다.
