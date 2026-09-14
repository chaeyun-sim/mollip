---
feature-slug: onboarding-replan
author: chris
status: prototype-in-progress
---

# Dev notes

## Implemented ACs

| AC   | Status                                | Files                     |
| ---- | ------------------------------------- | ------------------------- |
| AC-9 | G4 prototype data, QA pending         | onboardingWallPieces.ts   |
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

## QA 결과 (Taylor 역할 — Manager 세션 직접 수행, Codex 세션 부재로 대행)

| 항목     | 결과                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tsc      | ✅ 0 errors                                                                                                                                                          |
| lint     | ✅ 0 errors (수정 후) — 최초 발견된 ESLint 에러 3건 수정 완료                                                                                                        |
| format   | ✅ Prettier 통과 (수정 후) — 최초 발견된 4개 파일 포맷 위반 수정 완료                                                                                                |
| 테스트   | ⚠️ onboarding 관련 테스트 파일 없음 (스킵 — 실패 아님, G4 프로토타입 범위)                                                                                           |
| 스크린샷 | ✅ iOS 시뮬레이터(iPhone 16 Pro) `app/settings/preferences.tsx` 경로에서 렌더 확인                                                                                   |
| 인터랙션 | ✅ tap 배치/해제, 선택 후 교체, drag 배치, 3장 이상 시 버튼 활성화 — 모두 정상 동작 확인                                                                             |
| 회귀     | ✅ 마이페이지, 다이어리 탭 정상 렌더 확인                                                                                                                            |
| 네이티브 | ⚠️ 시뮬레이터에 설치된 기존 빌드가 `expo-secure-store`를 포함하지 않아 앱 전체 크래시 — `pod install` + `expo run:ios` 리빌드로 해결 (Chris 작업과 무관한 환경 이슈) |

### 발견 및 수정한 결함

1. **[P1, 수정 완료]** `OnboardingDraggable.tsx` — `react-hooks/refs` ESLint 에러 3건 (`onStart`/`onEnd`/`onFinalize` 콜백 내 ref 접근). gesture-handler 콜백은 렌더 이후 제스처 시점에만 실행되어 안전하므로 사유를 명시한 `eslint-disable-next-line` 처리.
2. **[P2, 수정 완료]** `OnboardingDraggable.tsx`, `OnboardingFrame.tsx`, `useOnboardingWallPlacement.ts`, `useOnboardingWallPreferences.ts` — Prettier 포맷 위반(공백 들여쓰기). `prettier --write`로 정리.
3. **[P2, 수정 완료]** `useOnboardingWallPlacement.ts` — `place`/`selectFrame`/`unplace`의 불필요한 `announce` 의존성 (exhaustive-deps 경고 4건) 제거.

4. **[AC-10, 수정 완료]** `useOnboardingWallPlacement.ts`의 `place()`에 주석 처리되어 있던 배치 완료 접근성 안내(`announce(...)`)를 사용자 확인 후 활성화. 스펙 문구("현대 미술 작품을 걸었어요. 3/5") 그대로 복원, `announce` 의존성 재추가, tsc/lint/prettier 재검증 + 시뮬레이터 재확인 완료.

### 2026-09-14 Chris 재검토 추가 수정

1. **[P2, 수정 완료]** `app/settings/preferences.tsx` — `renderCuration()` 함수형 렌더 분기를 제거하고 상태별 early return으로 정리해 `.docs/rules/component-convention.md` §11.2/§11.4를 준수.
2. **[P2, 수정 완료]** `OnboardingGalleryWall.tsx` — 트레이 셀 조건부 `className` 직접 삼항을 `cn`으로 교체하고 미사용 `viewportHeight` state 제거.
3. **[P2, 수정 완료]** `OnboardingFrame.tsx`, `onboardingWallPieces.ts` — import 순서와 타입 선언 포맷 정리.

| 항목     | 결과                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| tsc      | ✅ 0 errors (`npx tsc --noEmit`)                                                                                   |
| lint     | ✅ 0 errors (`npm run lint`) — 온보딩/설정 관련 warning 0건. 남은 5개 warning은 다이어리/북마크/테스트 기존 범위   |
| 테스트   | ✅ 13 suites / 142 tests passed (`npm test -- --runInBand`)                                                        |
| 스크린샷 | ✅ `.docs/wip/onboarding-replan/evidence/chris-fix-2026-09-14/00-current.png`, `03-after-third-placement.png` 확인 |
| 인터랙션 | ✅ Maestro 라벨 탭으로 작품 3개 배치 후 CTA 활성화 확인                                                            |
| 비고     | ⚠️ 첫 번째 트레이 카드는 Expo dev overlay 버튼과 겹쳐 탭이 가로막힘. 앱 UI 결함이 아닌 개발 오버레이 영향으로 판단 |

### 확인했지만 수정하지 않은 항목

- 실제 Supabase `preferred_genres` 저장(`handleConfirm`)은 실사용자 계정 데이터 보호를 위해 실행하지 않음.

상세 QA 결과는 `05-qa-report.md` 참고.
