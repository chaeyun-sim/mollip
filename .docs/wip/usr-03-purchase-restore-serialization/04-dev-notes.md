---
feature: USR-03 구매와 복원 동시 실행
status: complete
---

- 전역 `purchaseOperationStore`에 `purchase | restore | null` 작업 상태와 동기 acquire/release를 추가했다.
- 기존 훅 로컬 ref 가드는 유지하고 전역 coordinator를 이중 방어로 사용한다.
- 충돌 시 구매·복원 작업별 안내 토스트를 표시한다.
- 모든 종료 경로에서 coordinator를 release하고 양방향 충돌 테스트를 추가했다.
