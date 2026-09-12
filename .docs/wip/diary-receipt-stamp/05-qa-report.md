---
feature-slug: diary-receipt-stamp
author: taylor
status: draft
---

## [Taylor (QA)]

# QA report — 관람 영수증 → 우표 다이어리

## Summary

- P0: 0 required for handoff — **다만 아래 P1 1건(시각·인터랙션 미검증) 때문에 사용자 확인 전 권장하지 않음**
- Tier: L
- Date: 2026-09-10
- 스코프: AC-1~5 (AC-6/7은 01-spec.md에서 다음 이터레이션으로 확정 연기됨)

## AC matrix

| AC | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf |
|----|--------|---------|--------|-------|---------|-----------|---------------|------------|---------|
| AC-1 (미확정 자동 생성) | ✅ | ✅(회귀 없음) | ✅(2건 발견·수정) | N/A(비시각) | ✅ | N/A | N/A | ✅(코드 리뷰) | ✅ |
| AC-2 (배너) | ✅ | ✅ | - | ✅(설계 검토) | ✅ | ⚠️ 미확인 | ⚠️ 미확인 | ⚠️ 미확인 | - |
| AC-3 (확정 큐) | ✅ | ✅ | - | ✅(설계 검토) | ✅ | ⚠️ 미확인 | ⚠️ 미확인 | ⚠️ 미확인 | - |
| AC-4 (7일 만료) | ✅ | ✅ | - | N/A(비시각) | ✅ | N/A | N/A | ✅(코드 리뷰) | ✅ |
| AC-5 (우표 캘린더) | ✅ | ✅ | - | ✅(설계 검토) | ✅ | ⚠️ 부분(앱 부팅 확인, 다이어리 탭 진입은 미확인) | ⚠️ 미확인 | ⚠️ 미확인 | - |

## Findings

### P0 (ship blocker)

(없음)

### P1

1. **다이어리 탭 진입 후의 실제 시각/인터랙션 검증 미완료.** `expo run:ios`로 시뮬레이터 빌드·설치·부팅까지는 성공했고 앱 홈 화면이 정상 렌더링되는 것을 스크린샷으로 확인했다(증빙 아래). 하지만 다이어리 탭으로 들어가 배너·우표 캘린더·확정 큐 화면을 직접 탭해서 확인하는 단계에서, Simulator 창이 사용자 데스크톱의 다른 창(브라우저·에디터)과 겹쳐 있는 작은 플로팅 창이라 좌표 기반 자동 클릭이 반복적으로 안 맞았고, 계속 시도하면 사용자의 다른 작업 창을 잘못 클릭할 위험이 있어 **의도적으로 중단**했다. 코드 리뷰·타입체크·로직 검증은 끝났지만, 실제 화면에서 배너 문구·우표 썸네일·서명 캔버스가 의도대로 보이는지는 아직 사람이 눈으로 확인해야 한다.

### P2

1. `ArchiveRecentVisits.tsx`가 어디서도 호출되지 않는 미사용 컴포넌트로 확인됨(이번 기능과 무관, 별도 정리 후보로만 기록).
2. `tailwind.config.js`의 `primary`/`primary-dark`/`accent` 실제 값이 `.docs/DESIGN_SYSTEM.md` 문서 기재값과 다름(이번 작업과 무관한 기존 드리프트, 별도 확인 필요).

## Evidence

| ID | Path | Description |
|----|------|-------------|
| E1 | `.docs/wip/diary-receipt-stamp/evidence/app-boot-home-screen.png` | `expo run:ios` 빌드 성공 후 시뮬레이터(iPhone 16, iOS 18.3)에서 앱이 크래시 없이 정상 부팅되고 홈 화면이 렌더링됨을 보여주는 스크린샷 |
| E2 | (터미널 로그, 파일 미보존) | `npx tsc --noEmit` → 0 errors, `npx eslint <변경 파일>` → 0 errors/warnings, `npm test` → 기존 52개 테스트 全통과 |

## Regression paths walked

1. `app/(tabs)/diary.tsx` 진입 조건(로그인 여부, 빈 상태) — 코드 리뷰로 확인, 시뮬레이터 실사용 미확인(P1 참고)
2. `app/(guide)/exit-summary.tsx` — 변경하지 않았음을 diff로 확인(스펙 준수)
3. 레거시 visits 데이터 마이그레이션(`_migrateLegacyStatus`) 및 `useVisitSync.ts` 로그인 재동기화 경로 — 코드 리뷰로 검증, 실제 로그인 기기에서의 확인은 이번 세션에서 못 함

## Recommendation

- [ ] Ready for Manager handoff
- [x] Return to Manager — 시뮬레이터에서 다이어리 탭/배너/확정 큐/우표 캘린더를 직접 눈으로 확인(Q6/Q7)한 뒤 G6 핸드오프로 진행할 것을 권장. 사용자가 직접 시뮬레이터를 열어 확인하거나, 다음 세션에서 Simulator 창을 격리된 위치로 옮겨 재시도하면 될 것 같음.
