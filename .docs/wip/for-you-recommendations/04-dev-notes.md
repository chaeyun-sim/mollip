---
feature-slug: for-you-recommendations
author: chris
status: implemented
---

# Dev notes — 취향 추천 그리드와 전체 보기

## Changes

- 홈 취향 추천을 기존 리스트형 카드에서 최대 2개 포스터 그리드로 변경하고, 후보가 3개 이상일 때 `더 보기` 액션을 노출한다.
- `/recommendations` 전용 화면을 추가해 선호 장르 일치 후보를 한 점씩 크게 보여주고 실제 장르 매칭 이유를 설명한다.
- 홈 미리보기용 재사용 포스터 카드와 상세 페이지용 큐레이션 카드를 분리한다.
- 추천 쿼리 최대 결과를 기존 5개에서 100개로 늘려 전체 보기에서 추가 결과를 제공한다.
- 취향 저장·초기화 성공 시 `preferredGenres` 캐시를 즉시 수정하고 추천 쿼리를 무효화한다.

## Files

- `src/components/home/RecommendedIndex.tsx`
- `src/components/home/PersonalizedExhibitionCard.tsx`
- `src/components/home/PersonalizedRecommendationCard.tsx`
- `src/hooks/queries/useRecommendedExhibitions.ts`
- `app/(tabs)/index.tsx`
- `app/recommendations.tsx`
- `app/settings/preferences.tsx`
- `app/_layout.tsx`

## Known limits

- 후보는 현재 `exhibitions.genre`의 정확한 장르 매칭으로 구성된다. `tags`에는 장르가 아닌 무료·어린이 등 관람/대상 태그를 저장하므로 이를 장르 매칭에 섞지 않는다.
- 한 번의 조회 상한은 100개다. 후보가 이를 넘을 경우 페이지네이션이 필요하다.
