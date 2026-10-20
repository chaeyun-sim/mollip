---
feature-slug: onboarding-genre-choice
author: taylor
status: partial
---

# QA report — 온보딩 장르 칩 선택

## AC evidence

| AC / 변경                                                   | Type check  | Tests                         | Simulator/device                    | Result  |
| ----------------------------------------------------------- | ----------- | ----------------------------- | ----------------------------------- | ------- |
| 온보딩 벽/장르 칩 경로                                      | ✅ 0 errors | ✅ 53 suites / 395 tests      | ⏸ 실기기 확인 대기, 시뮬레이터 제외 | Partial |
| 취향 강화: 세로 취향 섹션, 작가 입력, 프로필 저장·추천 연결 | ✅ 0 errors | ✅ 작가 매칭 유닛 테스트 포함 | ⏸ 실기기 확인 대기, 시뮬레이터 제외 | Partial |

## Checks

- `npm test -- --runInBand`: passed, 53 suites / 395 tests.
- `git diff --check`: passed.
- `npx tsc --noEmit`: passed, 0 errors after fixing one preference utility typing issue.
- Prettier check for changed application files: passed.
- Simulator testing is excluded at the user's request. Physical-device visual and interaction evidence is pending.
- DB migration application and physical-device save/reopen/recommendation verification require the deployed Supabase project and device; not verified in this environment.
- Independent Alex design review is not run in this Codex session.

## Manual scenarios

1. From onboarding, enter wall mode, choose at least three pieces, save, and confirm the home recommendations use the saved genres.
2. Return to onboarding in a fresh account, enter chip mode, select multiple genres, save, and confirm those exact genres appear in recommendation preferences.
3. In chip mode, verify the submit button stays disabled until one genre is selected.
4. Simulate profile update failure, retry, and confirm selected chips remain selected and the same genre list is resubmitted.
5. Back out of chip mode and re-enter; confirm the selection remains during the same onboarding session.
6. From settings, open `취향 강화하기`; confirm no genre picker is shown and the mood, venue scale, and art movement sections stack vertically.
7. Select traits, save, reopen the screen, and confirm the saved values are restored.
8. Add an artist; verify a recommendation whose title/description contains that name gets the artist reason, while unmatched items do not claim an artist match.
9. Remove an artist and save; verify it stays removed after reopening settings.

## Status

Implementation is in place. Physical-device visual and interaction evidence remains pending.
