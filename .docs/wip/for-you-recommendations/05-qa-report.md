---
feature-slug: for-you-recommendations
author: taylor
status: blocked
---

# QA report — 취향 추천 미리보기와 큐레이션 페이지

## AC evidence

| AC                  | tsc         | Tests                               | Screenshot                    | Interaction                  | Result  |
| ------------------- | ----------- | ----------------------------------- | ----------------------------- | ---------------------------- | ------- |
| AC-1 홈 미리보기    | ✅ 0 errors | ⚠️ 전체 1건 실패 (기능 무관 테스트) | ⏸ 실기기 확인 중, 캡처 미수집 | ⏸ 사용자 실기기 확인 진행 중 | Partial |
| AC-2 전체 페이지    | ✅ 0 errors | ⚠️ 전체 1건 실패 (기능 무관 테스트) | ⏸ 실기기 확인 중, 캡처 미수집 | ⏸ 사용자 실기기 확인 진행 중 | Partial |
| AC-3 상태·취향 갱신 | ✅ 0 errors | ⚠️ 전체 1건 실패 (기능 무관 테스트) | ⏸ 실기기 확인 중, 캡처 미수집 | ⏸ 사용자 실기기 확인 진행 중 | Partial |

## Checks

- `npx tsc --noEmit`: passed, 0 errors.
- `npm test -- --runInBand`: 51 suites passed, 1 suite failed (390 passed / 391 tests). `src/hooks/queries/__tests__/usePreferences.test.tsx` fails because the pending mocked query does not expose `['회화']` after its flush; reproduced when run alone. This test does not exercise recommendation ranking or cards.
- `git diff --check`: passed.
- Simulator testing is intentionally excluded at the user's request; the user is testing on a physical device. Screenshot and interaction evidence remain pending.
- Claude Alex design review: not run because Claude CLI is not authenticated (`Not logged in`).

## Exception QA scenarios — manual required

1. Save different preferences, return to home, and confirm the preview changes without refresh.
2. Clear preferences, return home, and confirm the personalized section disappears.
3. Open `더 보기`, tap a poster, then go back and confirm the grid state remains usable.
4. Test zero matches, one match, two matches, and more than two matches. Confirm CTA only appears above two results.
5. Disable network while loading the full page, then retry after restoring connectivity.
6. Open the page with no saved genres and confirm the empty state does not show unrelated exhibitions as personalized.

## Status

Implementation is in place. Static checks passed; visual/interaction verification remains with the user's current physical-device session. The independent design QA gate also remains open because Claude CLI is unauthenticated.
