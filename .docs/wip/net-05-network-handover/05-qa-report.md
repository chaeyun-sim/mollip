---
feature: NET-05 Wi-Fi/LTE·5G 반복 전환 중 구매 일관성
status: complete-with-environment-note
---

| 항목                 | 결과                               |
| -------------------- | ---------------------------------- |
| TypeScript           | ✅ `npx tsc --noEmit`              |
| Automated tests      | ✅ 전체 Jest 통과                  |
| 중복 purchasePackage | ✅ 동기 구매 가드와 attempt guard  |
| 중복 성공 처리       | ✅ one-shot completion 회귀 테스트 |
| 실제 네트워크 전환   | ⚠️ 실기기에서 별도 확인 필요       |

Wi-Fi와 셀룰러를 실제로 반복 전환하는 테스트는 현재 환경에서 자동 재현하지 않았다. 최종 QA에서는 StoreKit 구매 시트가 열린 상태에서 전환을 반복하고, RevenueCat 로그와 화면 이동·토스트 횟수를 함께 확인해야 한다.
