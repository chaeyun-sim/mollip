---
feature: NET-08 기존 구독자의 장기 오프라인 사용
status: ready
---

NET-08 구현을 완료했다. 온라인 검증 후 72시간까지 캐시 entitlement를 허용하고, 이후에는 저장된 Zustand 값만으로 권한을 유지하지 않는다. 연결 복구 시 최신 CustomerInfo를 다시 확인해 권한을 복구한다.
