---
feature-slug: compact-personalized-card
author: manager
status: blocked
---

# Handoff

홈 취향 추천 카드를 작은 가로 레이아웃으로 변경했다. 왼쪽에 88×116pt 포스터, 오른쪽에 상태·제목·장소를 순서대로 표시하고 구분선 아래에 실제 매칭된 모든 취향을 짧은 태그로 표시한다. 상세 이동 경로는 그대로 사용한다.

타입 검사는 통과했다. 전체 테스트에서는 취향 조회 테스트 한 건이 실패했으며, 단독 실행에서는 통과했다. 시뮬레이터 앱의 `ExpoPushTokenManager` 오류 때문에 실제 화면과 상호작용은 확인하지 못했다. 자세한 증빙은 `05-qa-report.md`에 기록했다.
