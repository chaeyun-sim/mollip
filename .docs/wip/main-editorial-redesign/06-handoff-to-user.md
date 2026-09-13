---
feature-slug: main-editorial-redesign
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

메인 화면(`app/(tabs)/index.tsx`)을 카드 나열형 구조에서 매거진(에디토리얼) 스타일로 전면 재설계했습니다. 마스트헤드 헤더, 룰선 기반 히어로, 커버스토리형 "오늘의 전시", 넘버링 인덱스 리스트, KCISA 넘버링까지 5개 영역을 전부 갈아엎었습니다. 데이터 로직·라우팅·FAB은 그대로입니다.

## What changed

- `app/(tabs)/index.tsx`: 헤더를 로고 확대+룰선+날짜 eyebrow("2026.08.25 · EXPLORE")로 재구성
- `src/components/explore/ExploreHomeHero.tsx`: 그라데이션 카드 박스 제거, 대형 세리프 헤드라인+룰선+캡션, 조각상 이미지는 절대 위치로 우상단에 걸치도록 재배치
- `src/components/explore/ExploreHomeSections.tsx`:
  - `FeaturedExhibitionHero`: 흰 pill 배지 제거 → "COVER STORY" eyebrow+룰선, 타이틀 확대(28→32px), 카드 높이 확대(300→340px)
  - `RecommendedExhibitions`: 기존 "리드+2열 그리드" 구조를 "리드 피처 1개 + 넘버링(01~04) 인덱스 리스트"로 전면 재구성 (신규 `IndexListRow` 서브컴포넌트)
- `src/components/explore/KcisaExhibitionCard.tsx` / `KcisaSection.tsx`: 카드 좌상단에 인덱스 넘버(01, 02, 03…) 오버레이 추가

## Evidence

| Feature / AC           | tsc         | Screenshot                     | Interaction       | Regression       |
| ---------------------- | ----------- | ------------------------------ | ----------------- | ---------------- |
| AC-1 마스트헤드 헤더   | ✅ 0 errors | `evidence/ac1-header.png`      | N/A               | 콜드 리런치 정상 |
| AC-2 히어로 에디토리얼 | ✅ 0 errors | `evidence/ac2-hero.png`        | N/A               | 콜드 리런치 정상 |
| AC-3 커버스토리        | ✅ 0 errors | `evidence/ac3-coverstory.png`  | 탭→상세 이동 확인 | 콜드 리런치 정상 |
| AC-4 인덱스 리스트     | ✅ 0 errors | `evidence/ac4-fix-04.png`      | 탭→상세 이동 확인 | 콜드 리런치 정상 |
| AC-5 KCISA 넘버링      | ✅ 0 errors | `evidence/ac5-kcisa-check.png` | 탭→상세 이동 확인 | 전시 탭 정상     |

전체 리포트: `.docs/wip/main-editorial-redesign/05-qa-report.md`

## Design QA

- Alex (Design QA) verdict: Pass @ iteration 1 (overall 4.0/5)

## Open questions

- (none)

## 참고

- 이전 Tier M 작업(`main-hero-visual-boost`)의 배지형 비주얼(오늘의 전시 pill, PICK 배지 일부)은 이번 에디토리얼 재설계로 대부분 대체되었습니다. 추천 전시 리드 카드의 "PICK" pill만 스코프상 유지했습니다 — 이것도 룰선 스타일로 바꾸길 원하시면 말씀해주세요.
- 이번에도 세션 팀 인프라 버그로 서브에이전트 위임이 불가능해 Manager가 John/Sam/Alex/Chris/Taylor 역할을 직접 순차 수행했습니다.

---

**확인 요청**

위 내용 기준으로 동작·UX를 한 번 봐 주세요.
OK면 commit / push / 배포 지시를 주시면 됩니다. 수정 원하시면 구체적으로 알려 주세요.
