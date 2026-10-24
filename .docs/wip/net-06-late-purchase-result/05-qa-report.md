---
feature: NET-06 장시간 타임아웃 후 늦은 성공 응답
status: complete-with-environment-note
---

| 항목                      | 결과                                                  |
| ------------------------- | ----------------------------------------------------- |
| TypeScript                | ✅ `npx tsc --noEmit`                                 |
| Automated tests           | ✅ 33개 스위트, 325개 테스트 통과                     |
| 대기 제한 종료            | ✅ `timedOut` 전환 테스트                             |
| 화면 unmount 후 늦은 성공 | ✅ active entitlement 전역 반영 테스트                |
| 재구매 방지               | ✅ pending 거래 store 및 훅 가드                      |
| 실기기 지연 재현          | ⚠️ RevenueCat/StoreKit 프록시 환경에서 최종 확인 필요 |

실제 지연 응답은 StoreKit 구매 시트와 RevenueCat 응답을 독립적으로 지연할 수 있는 테스트 환경에서 확인해야 한다.
