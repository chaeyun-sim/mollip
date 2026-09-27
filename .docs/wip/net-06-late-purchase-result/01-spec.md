---
feature: NET-06 장시간 타임아웃 후 늦은 성공 응답
tier: S
status: implemented
---

## Acceptance Criteria

- 구매 대기 제한이 지나면 화면은 `timedOut` 상태가 되고 사용자가 화면을 닫을 수 있다.
- 타임아웃은 거래 취소나 결제 실패로 처리하지 않는다.
- 미확정 거래가 남아 있는 동안 재구매를 호출하지 않는다.
- 화면이 닫힌 뒤 도착한 active entitlement도 전역 구독 상태에 반영한다.
- 늦은 성공으로 화면 이동·성공 안내가 중복 실행되지 않는다.
