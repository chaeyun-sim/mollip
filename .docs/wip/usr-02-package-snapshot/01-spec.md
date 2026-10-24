---
feature: USR-02 구매 중 상품 변경
tier: S
status: implemented
---

## Acceptance Criteria

- 구매 시작 시 전달한 RevenueCat package가 해당 거래의 상품으로 고정된다.
- 구매 처리 중 플랜 선택 변경은 UI와 훅 양쪽에서 차단된다.
- Apple 결제창에 전달되는 package의 기간·가격은 구매 시작 시 선택과 일치한다.
- 구매 취소 후에는 다른 상품을 선택해 재구매할 수 있다.
