---
feature: USR-04 Apple 결제창 직접 취소
status: complete
---

| 항목             | 결과                                    |
| ---------------- | --------------------------------------- |
| TypeScript       | ✅ `npx tsc --noEmit`                   |
| Automated tests  | ✅ 구매 훅 42개 테스트 통과             |
| 오류 안내 없음   | ✅ 취소 시 toast 0회                    |
| 성공 이벤트 없음 | ✅ navigation 0회·권한 false            |
| 재구매           | ✅ 취소 후 두 번째 purchasePackage 호출 |
| 전역 해제        | ✅ operation·pending 모두 해제          |
