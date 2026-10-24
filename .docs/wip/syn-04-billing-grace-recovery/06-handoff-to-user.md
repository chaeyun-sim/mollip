---
feature-slug: syn-04-billing-grace-recovery
author: manager
status: ready-for-user
---

# Handoff

SYN-04를 구현했다. 결제 문제가 감지되어도 active entitlement면 grace 중 접근을 유지하고 안내만 표시하며, inactive entitlement면 권한을 지급하지 않는다. CustomerInfo가 회복되면 billing warning이 제거되고 active entitlement 기준으로 복구된다.

검증: `npx tsc --noEmit` exit 0, Jest 31 suites / 316 tests 통과. 실제 Apple Sandbox 갱신 실패와 grace 기간 만료는 App Store Connect 설정·Sandbox 계정이 없어 미검증 상태다.

커밋은 생성하지 않았다.
