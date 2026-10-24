---
feature-slug: home-discovery-sections
author: manager
status: ready-for-user (인터랙션 일부 미검증)
---

# Handoff to user

## Summary

홈 하단 3섹션을 기존 데이터만으로 재구성했다: 인기=포스터+텍스트 컬렉션, 국립=웜 톤 밴드의 큰 세로 갤러리, 추천=2열 포스터 그리드. 상단(헤더·검색·히어로·FAB)은 그대로다. 카드 탭/뒤로/더보기 이동은 시뮬레이터 종료로 검증하지 못했다.

## What changed

- `app/(tabs)/index.tsx` 하단 교체
- 신규 `src/components/home/*` 5개, `src/utils/homeLayout.ts` + 테스트
- 커밋·배포·백엔드·의존성 변경 없음, `skills-lock.json` 등 기존 변경 보존

## Evidence

| Feature / AC | tsc | Screenshot                         | Interaction                   | Regression   |
| ------------ | --- | ---------------------------------- | ----------------------------- | ------------ |
| AC-1 인기    | ✅  | 확인(수정 전 빌드, 이후 무변경)    | ❌ 미검증                     | 상단 보존 ✅ |
| AC-2 국립    | ✅  | `evidence/02-national-gallery.png` | 가로 스크롤 ✅ / 탭·더보기 ❌ | 상단 보존 ✅ |
| AC-3 추천    | ✅  | `evidence/03-…`, `04-…`            | 세로 스크롤 ✅ / 탭 ❌        | 상단 보존 ✅ |

Jest: 신규 6/6, 앱 266 pass. 11 suites는 `.agents/skills/...`의 기존 실패.

## Design QA

- Alex: Pass @ iteration 1 (4.25/5)

## Open questions

- 시뮬레이터/Metro 8082가 종료된 상태다. 재기동 후 `evidence/flow-taps.yaml`(단일 플로우)로 탭 회귀를 확인하거나 직접 확인 부탁.

## User feedback

### Triage

- [ ] Design / Dev / Spec / No change required

---

**확인 요청**

실기기/시뮬레이터에서 각 섹션 카드 탭→상세→뒤로, 국립 더보기, 좁은 화면 레이아웃을 한 번 봐 주세요. OK면 commit 지시를 주시면 됩니다.
