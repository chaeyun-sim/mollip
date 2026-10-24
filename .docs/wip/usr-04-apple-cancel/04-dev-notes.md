---
feature: USR-04 Apple 결제창 직접 취소
status: complete
---

- 기존 `userCancelled` 및 `PURCHASE_CANCELLED_ERROR` 분류를 정상 취소 경로로 유지했다.
- 취소 시 `purchaseStatus`를 idle로 복귀하고 pending·전역 operation을 해제한다.
- 취소 후 재구매와 성공 이벤트 미발생을 회귀 테스트로 검증했다.
