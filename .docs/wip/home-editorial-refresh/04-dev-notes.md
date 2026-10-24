---
feature-slug: home-editorial-refresh
author: chris
status: done
---

# Dev notes

## 변경 파일

- `app/(tabs)/index.tsx` — 전면 재구성: 자동 재생 `setInterval` 제거, `useWindowDimensions` 기반 `getFeaturedPageMetrics`, `onScroll` → `getFeaturedPageIndex`, 위치 표시, 날짜 헤드, 지도 `IconButton`, 확장형 FAB, `ScreenHeader fullBleed`(`-mr-12`/`px-6` 제거), 히어로 스켈레톤.
- `src/components/explore/FeaturedExhibitionHero.tsx` — props `title`→`tagline`, `width` 추가, 전시명 중심 레이아웃, `ImageFallback`(`thumbnail!` 제거).
- `src/hooks/queries/useFeaturedTrio.ts` — 반환값에 `isLoading` 추가(데이터 로직 불변).
- `src/utils/featuredPaging.ts` (신규) + `src/utils/__tests__/featuredPaging.test.ts` (신규).

## 메모

- 스냅: `snapToInterval=카드폭+12`, `snapToAlignment="start"`, `disableIntervalMomentum`. 마지막 오프셋 = 2×interval로 계산상 정확히 맞아 떨어짐.
- 유틸·테스트는 구현과 함께 작성했다(엄밀한 RED-first 아님).
- 구독 로딩 가드·프리미엄 분기·`returnTo`는 원본 로직 그대로.
