---
feature-slug: onboarding-genre-choice
author: chris
status: implemented
---

# Dev notes — 온보딩 장르 칩 선택

## Changes

- 프롤로그에서 작품을 골라 벽을 꾸미거나, 장르 칩으로 빠르게 선택하는 경로를 제공한다.
- 칩은 벽 선택과 같은 정규 장르 7개를 사용하고 복수 선택할 수 있다.
- 칩 선택은 1개 이상일 때 저장할 수 있으며 `preferred_genres`에 저장하고 `preferred_wall_piece_ids`는 빈 배열로 저장한다.
- 벽/칩 경로가 공통 프로필 저장, 오프라인 pending 저장, 재시도, 저장 없이 시작 흐름을 공유한다.
- 내 취향 수정의 벽 저장 버튼 오른쪽에 primary `취향 강화하기`를 추가하고, 현재 선택 장르·액자 ID를 칩 페이지로 넘긴다.
- `취향 강화하기`는 장르 재선택 대신 그림 분위기, 전시장 규모, 미술사조를 세로 섹션으로 선택한다. 해당 라우트는 자체 `Screen.Header`만 보인다.
- 확장 취향은 `profiles.preferred_taste_details`에 저장하고 프로필 캐시 및 추천 쿼리를 갱신한다.
- 관심 작가는 직접 입력해 칩으로 추가·삭제하며, 기존 `profiles.preferred_artists`를 사용한다.
- 전시 제목·설명에 관심 작가 이름이 포함되면 추천 점수에 반영하고, 이유에 작가명을 표시한다.
- 추천은 전시 제목·설명·장소명에서 선택 취향 키워드가 확인될 때 보조 점수를 준다. 장소 규모는 장소명 휴리스틱이며 실제 공간 크기 메타데이터는 아니다.

## Files

- `app/onboarding/index.tsx`
- `app/settings/preferences.tsx`
- `app/settings/preferences-chips.tsx`
- `src/components/onboarding/OnboardingGalleryWall.tsx`
- `src/components/onboarding/OnboardingWallPrologue.tsx`
- `src/components/onboarding/OnboardingGenrePicker.tsx`
- `src/components/onboarding/PreferredTastePicker.tsx`
- `src/utils/preferredTaste.ts`
- `supabase/migrations/20261019010000_add_preferred_taste_details.sql`
- `src/utils/onboardingWallGenres.ts`

## Limits

- 온보딩의 빠른 선택 경로는 기존 정규 장르를 사용한다. 추천 특성 매칭은 제목·설명·장소명에 키워드가 실제로 있는 경우만 작동한다.
