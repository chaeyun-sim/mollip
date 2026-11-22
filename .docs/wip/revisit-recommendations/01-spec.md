---
feature-slug: revisit-recommendations
tier: M
author: john
status: approved
---

# Spec — 재방문 의향 기반 전시 추천

## Problem

- 기록하기에서 "또 갈래요(isRevisit)"를 저장하지만 어디에서도 쓰지 않는다.

## Goals

- "또 갈래요"를 고른 전시의 **미술관**과 **장르**를 맞춤 추천 점수에 반영한다.
- 추천 카드에 이유 태그("다시 찾고 싶은 미술관", "좋아한 장르")를 붙인다.

## Constraints

- 추천은 기존처럼 클라이언트(`useRecommendedExhibitions`)에서 점수를 매긴다. 서버 함수는 바꾸지 않는다.
- `exhibitions`에 작가 컬럼이 없다 → 작가 신호는 이번 범위에서 뺀다 (사용자 확인).

## Non-goals (out of scope)

- 별점 기반 신호, "아마 안 갈래요" 감점 신호 (사용자 확인: 쓰지 않음).
- 취향 저장이 없는 사용자에게 추천을 여는 것 (기존 `isPersonalized` 게이트 유지).
- 작가 신호, 서버 푸시 추천(`send-recommendations`).

## Acceptance criteria

### AC-1: 같은 미술관 가점

- **Given** "또 갈래요"로 확정 기록한 전시 A(미술관 M)가 있다
- **When** 맞춤 추천을 계산한다
- **Then** 미술관 M에서 진행 중인 전시는 +30점, 태그 `revisit_venue`가 붙는다

### AC-2: 같은 장르 가점

- **Given** 전시 A의 장르가 G다
- **When** 맞춤 추천을 계산한다
- **Then** 장르 G 전시는 +20점, 태그 `revisit_genre`가 붙는다

### AC-3: 장르 필터에 걸려 빠지던 같은 미술관 전시도 후보에 든다

- **Given** 선호 장르만 저장돼 장르로 후보를 좁혀 받는 사용자
- **When** 미술관 M의 전시가 그 장르가 아니다
- **Then** 미술관 M의 진행 중 전시를 따로 받아 후보에 합친다

### AC-4: 신호가 없으면 기존과 같다

- **Given** "또 갈래요" 기록이 없다
- **When** 추천을 계산한다
- **Then** 추가 요청 없이 기존 점수·결과와 같다

## Screens / routes

| Route        | 변경                                           |
| ------------ | ---------------------------------------------- |
| 홈·탐색 추천 | 추천 순서와 이유 태그만 바뀐다 (레이아웃 동일) |

## Feature breakdown (for Chris)

1. `src/utils/revisitAffinity.ts` — 좋아한 전시 ID 추출, 미술관·장르 집합, 태그 계산 (순수 함수 + 테스트)
2. `useRecommendedExhibitions` — 좋아한 전시 메타 조회 → 같은 미술관 후보 추가 → 점수·태그 반영
3. locale — `recommendations.labels.revisit_venue` / `revisit_genre`
