---
feature: USR-01 구매 버튼 연타
status: complete
---

| 항목                | 결과                          |
| ------------------- | ----------------------------- |
| TypeScript          | ✅ `npx tsc --noEmit`         |
| Automated tests     | ✅ 구매 훅 38개 테스트 통과   |
| 10회 연타           | ✅ purchasePackage 1회        |
| 처리 중 추가 탭     | ✅ 추가 호출 0회              |
| 취소 후 재구매      | ✅ 두 번째 호출 정상 동작     |
| 구매·복원 동시 실행 | ✅ 기존 상호 배타 테스트 통과 |
