---
feature: USR-03 구매와 복원 동시 실행
status: ready
---

USR-03 구현을 완료했다. 구매와 복원은 전역 coordinator로 직렬화되고, 충돌 작업은 안내 후 차단되며 기존 작업 종료 후 조작이 복구된다.
