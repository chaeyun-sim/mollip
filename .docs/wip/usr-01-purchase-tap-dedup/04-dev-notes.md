---
feature: USR-01 구매 버튼 연타
status: complete
---

- 기존 동기 `purchaseOpRef` 가드를 유지해 React 상태 업데이트 전 연타도 차단했다.
- 취소·기타 실패 시 `purchaseStatus`를 idle로 복귀시켜 영구 잠금을 방지했다.
- 10회 연타와 취소 후 재구매 회귀 테스트를 추가했다.
