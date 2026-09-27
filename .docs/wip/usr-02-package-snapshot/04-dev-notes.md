---
feature: USR-02 구매 중 상품 변경
status: complete
---

- 구매 함수가 호출 시점의 `selectedPackage` 객체를 사용하도록 유지했다.
- 원시 React setter 대신 구매/복원/대기 상태를 확인하는 `selectPlan`을 훅에서 반환한다.
- 처리 중 플랜 변경 시 선택 상태와 SDK package가 유지되는 회귀 테스트를 추가했다.
