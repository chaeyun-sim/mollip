---
feature: USR-03 구매와 복원 동시 실행
tier: S
status: implemented
---

## Acceptance Criteria

- 구매와 복원은 전역에서 동시에 실행되지 않는다.
- 충돌하는 작업은 SDK를 호출하지 않고 현재 작업 안내를 표시한다.
- 성공·취소·실패·타임아웃 이후 coordinator가 해제되어 다음 조작이 가능하다.
- 다른 화면의 구매 훅 인스턴스에서도 동일한 직렬화 규칙을 적용한다.
