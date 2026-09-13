---
feature-slug: onboarding-replan
author: chris
status: prototype-in-progress
---

# Dev notes

## Implemented ACs

| AC | Status | Files |
| --- | --- | --- |
| AC-9 | G4 prototype data, QA pending | onboardingWallPieces.ts |
| AC-3 | G4 minimum drag/tap wall, in progress | OnboardingGalleryWall.tsx |

## Implementation decisions

- G3 Pass 인수. G4 시뮬레이터 스모크를 위한 최소 UI만 연결한다. production AC 완료를 의미하지 않는다.
- 마이페이지 > 내 취향 수정 > 전시 벽 다시 꾸미기 경로를 사용한다.

## Changed files

- 구현 후 기입.

## Deviations from spec/brief

- G4 범위의 제한은 구현 후 명시한다.

## Blockers for Taylor (QA)

- Manager가 시뮬레이터 제어 및 독립 스모크를 담당한다. 저장은 실행하지 않는다.

## Native / env notes

- 신규 네이티브 의존성 없음.
