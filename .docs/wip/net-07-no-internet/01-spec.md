---
feature: NET-07 연결 표시는 있지만 인터넷 사용 불가
tier: S
status: implemented
---

## Acceptance Criteria

- 네트워크 아이콘이 연결 상태여도 실제 RevenueCat 요청 실패를 통신 불가로 처리한다.
- DNS, captive portal, VPN 차단, timeout, 원시 HTML 응답을 사용자용 문구로 정규화한다.
- 상품 조회와 상태 조회는 복구 가능한 오류 및 재시도 경로를 제공한다.
- 내부 서버 응답이나 HTML을 화면에 노출하지 않는다.
