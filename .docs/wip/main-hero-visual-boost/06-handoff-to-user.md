---
feature-slug: main-hero-visual-boost
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

메인 화면(`app/(tabs)/index.tsx`) 상단 히어로·오늘의 전시 카드·추천 전시 리드 카드 3곳의 비주얼 임팩트를 강화했습니다. 레이아웃 골격과 데이터 로직은 그대로이고, 이미지 크기·그라데이션 대비·배지만 조정했습니다. 구현 중 발견한 회귀 2건(히어로 타이틀 줄바꿈, 배지 텍스트 클리핑)은 자가 수정 루프에서 즉시 고쳤습니다.

## What changed

- `src/components/explore/ExploreHomeHero.tsx`: 조각상 이미지 확대(72×100 → 84×116), 그라데이션 첫 색상을 더 진한 보라(`#DCC9F0`)로 강화
- `src/components/explore/ExploreHomeSections.tsx`:
  - `FeaturedExhibitionHero`: "오늘의 전시" 라벨을 흰색 pill 배지로 변경, 타이틀 26px→28px, 오버레이 그라데이션 대비 강화
  - `RecommendedExhibitions` 리드 카드: 좌상단에 "PICK" 배지 추가

## Evidence

| Feature / AC             | tsc         | Screenshot                          | Interaction         | Regression       |
| ------------------------ | ----------- | ----------------------------------- | ------------------- | ---------------- |
| AC-1 히어로 비주얼       | ✅ 0 errors | `evidence/main-hero-after-fix.png`  | N/A(정적 카드)      | 콜드 리런치 정상 |
| AC-2 오늘의 전시 배지    | ✅ 0 errors | `evidence/main-hero-after-fix2.png` | 탭 → 상세 이동 확인 | 콜드 리런치 정상 |
| AC-3 추천 리드 PICK 배지 | ✅ 0 errors | `evidence/scroll-recommended.png`   | 탭 → 상세 이동 확인 | 지도 탭 정상     |

전체 리포트: `.docs/wip/main-hero-visual-boost/05-qa-report.md`

## Design QA

- Alex (Design QA) verdict: Pass @ iteration 1 (overall 4.25/5)

## Open questions

- (none)

## 참고

- 이번 파이프라인은 세션 팀 인프라 버그(`team file not found`)로 John/Sam/Chris/Taylor 서브에이전트 위임이 불가능해, Manager(메인 세션)가 각 역할을 직접 순차 수행했습니다. 산출물(`01-spec.md` ~ `05-qa-report.md`)은 정상적으로 `.docs/wip/main-hero-visual-boost/`에 남겼습니다.
- 전시 상세 화면의 "뒤로가기" 자동 탭 재현은 테스트 툴 좌표 문제로 실패했으나(코드 결함 아님), 정방향 내비게이션과 화면 자체는 정상 확인됨 — 5번 QA 리포트 하단 참고.

---

**확인 요청**

위 내용 기준으로 동작·UX를 한 번 봐 주세요.
OK면 commit / push / 배포 지시를 주시면 됩니다. 수정 원하시면 구체적으로 알려 주세요.
