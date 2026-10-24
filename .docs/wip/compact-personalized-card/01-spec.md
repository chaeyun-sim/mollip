---
feature-slug: compact-personalized-card
tier: M
author: john
status: pass
---

# Spec — 홈 취향 추천 카드 축소

## Goal

홈의 큰 세로 포스터 카드 네 장이 차지하는 스크롤 길이를 줄이면서 추천 근거를 유지한다.

## Acceptance criteria

### AC-1

- **Given** 취향 추천 전시가 표시된다
- **When** 사용자가 홈의 FOR YOU 섹션을 본다
- **Then** 각 항목은 작은 포스터와 제목·장소·추천 이유가 나란히 배치된 카드로 표시된다.
- **And** 카드를 누르면 기존 전시 상세로 이동하며 접근성 라벨에 전시 정보와 추천 이유가 포함된다.

### AC-2

- **Given** 전시 정보에 저장된 취향과 일치하는 장르·분위기·전시장 유형·미술사조·작가가 여럿 있다
- **When** 추천 카드가 표시된다
- **Then** 추천 문장 대신 실제로 일치한 모든 취향을 중복 없는 짧은 태그 목록으로 표시한다.

## Out of scope

- 추천 순서, 장르 매칭, 조회 수 변경
