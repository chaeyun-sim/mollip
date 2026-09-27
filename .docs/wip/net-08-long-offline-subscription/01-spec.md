---
feature: NET-08 기존 구독자의 장기 오프라인 사용
tier: M
status: implemented
---

## Policy

- 마지막 온라인 CustomerInfo 검증 후 72시간까지 SDK 캐시의 active entitlement를 허용한다.
- 72시간이 지나면 캐시와 Zustand 값만으로 권한을 유지하지 않는다.
- 온라인 복구 시 캐시 무효화 후 CustomerInfo를 다시 확인한다.

## Acceptance Criteria

- 마지막 온라인 검증 후 허용 기간 안에서는 오프라인 유료 기능을 사용할 수 있다.
- 허용 기간이 지나면 인터넷 연결 안내와 함께 유료 기능을 차단한다.
- 온라인 active entitlement 확인 후 권한이 복구된다.
- 단순 조회 실패로 검증 시각을 갱신하지 않는다.
