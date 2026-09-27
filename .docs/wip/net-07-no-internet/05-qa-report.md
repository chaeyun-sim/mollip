---
feature: NET-07 연결 표시는 있지만 인터넷 사용 불가
status: complete-with-environment-note
---

| 항목                      | 결과                                 |
| ------------------------- | ------------------------------------ |
| TypeScript                | ✅ `npx tsc --noEmit`                |
| Automated tests           | ✅ 전체 Jest 통과                    |
| 원시 응답 비노출          | ✅ 정규화 함수 테스트                |
| 상품 조회 복구            | ✅ 기존 timeout/error/retry 테스트   |
| 상태 조회 복구            | ✅ 사용자용 네트워크 문구 적용       |
| 공용 Wi-Fi/DNS/VPN 실환경 | ⚠️ 최종 기기 환경에서 각각 확인 필요 |

연결 아이콘만 있고 인터넷이 없는 환경은 실제 공용 Wi-Fi captive portal, DNS 차단, VPN 정책으로 최종 재현해야 한다.
