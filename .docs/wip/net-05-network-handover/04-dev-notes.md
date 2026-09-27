---
feature: NET-05 Wi-Fi/LTE·5G 반복 전환 중 구매 일관성
status: complete
---

- 구매 attempt 세대와 완료 one-shot guard를 추가했다.
- 구매 결과가 active가 아닐 때 늦은 CustomerInfo 응답으로 기존 권한을 지우지 않도록 즉시 동기화를 보류한다.
- 연결 전환으로 성공 경로가 겹치는 회귀 테스트를 추가했다.
