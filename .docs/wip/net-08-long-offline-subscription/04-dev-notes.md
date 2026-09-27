---
feature: NET-08 기존 구독자의 장기 오프라인 사용
status: complete
---

- `subscriptionVerification.ts`에 72시간 오프라인 허용 정책과 마지막 온라인 검증 시각 저장을 추가했다.
- 앱 시작·foreground 복귀 시 CustomerInfo 캐시를 무효화한 뒤 성공한 경우에만 검증 시각을 갱신한다.
- `syncSubscription`은 저장된 검증 시각이 만료되면 active 캐시를 권한으로 사용하지 않는다.
- 구매 직후 active entitlement는 기존 구매 흐름대로 즉시 반영할 수 있고, 다음 앱 시작에서 정책을 다시 평가한다.
