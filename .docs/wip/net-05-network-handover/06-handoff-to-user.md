---
feature: NET-05 Wi-Fi/LTE·5G 반복 전환 중 구매 일관성
status: ready
---

NET-05 구현을 완료했다. 연결 전환 중에도 구매 API는 한 번만 호출되고, 결과는 active entitlement 또는 확인 대기 상태로 수렴한다. 성공 이동과 안내는 one-shot으로 보호된다.
