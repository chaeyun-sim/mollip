---
feature-slug: syn-04-billing-grace-recovery
author: sam
status: complete
---

# Design brief

- Active + billing issue: 기존 Premium 배너를 유지하고 하단에 정확한 결제 안내 문구를 추가한다. 기능 접근은 유지한다.
- Inactive + billing issue: 기존 무료/잠금 상태를 사용해 기능을 차단한다. 결제 상태는 구독 관리 화면에서 확인한다.
- Recovery: CustomerInfo 갱신으로 billing warning이 사라지고 기존 Premium 배너가 정상 상태로 돌아온다.
- 별도 grace countdown은 표시하지 않는다. 앱이 계산한 시간이 Apple 상태와 어긋날 수 있기 때문이다.

접근성: 기존 배너의 `accessibilityLabel`과 구독 관리 버튼을 유지한다. 안내 문구는 화면 낭독기에 함께 노출한다.
