---
feature: NET-04 RevenueCat 통신 단절 후 구매 결과 복구
author: taylor
status: complete-with-environment-note
---

## Verification

| 항목                    | 결과                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| TypeScript              | ✅ `npx tsc --noEmit` 0 errors                                                   |
| Automated tests         | ✅ 전체 Jest 통과                                                                |
| Active entitlement 성공 | ✅ 기존 purchase 성공 경로로 검증                                                |
| RC 네트워크 단절        | ✅ 지정 문구·uncertain·재구매 차단 테스트                                        |
| 복구 재조회             | ✅ 상태 확인은 cache invalidate 후 getCustomerInfo, foreground는 getCustomerInfo |
| 중복 구매 방지          | ✅ purchase operation guard 및 uncertain guard                                   |

실제 Apple 승인 직후 RevenueCat endpoint만 차단하는 Sandbox 재현은 네트워크 프록시와 결제 자격 조건에 의존하므로 자동 테스트로 대체했다. 실제 기기 검증에서는 Offline Entitlements가 활성화되고 사전 온라인 캐시가 존재하는 계정으로 active entitlement 반환/미반환 두 경우를 각각 확인해야 한다.
