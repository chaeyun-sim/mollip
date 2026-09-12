---
feature-slug: color-system-overhaul
author: manager
status: ready-for-user
---

# Handoff to user

## Summary

앱 전체 컬러 토큰을 개편했다. 텍스트 명도는 `gray100~900` 스케일로, 브랜드 컬러(버튼·탭바·FAB 등)는 근검정에서 더스티 라벤더(`primary #81759B`)로 바뀌었다. 17개 AC 전부 완료, tsc/테스트 통과, QA에서 발견된 P1 2건(범위 밖 색상 회귀, 문서 대비 수치 오류)도 수정 완료.

## What changed

- `tailwind.config.js` / `src/constants/colors.ts`: `gray100~900` 신규 추가, `primary`/`secondary`/`accent` 값 교체(브랜드 컬러), `tertiary`/`muted` 제거
- 앱 전체 58개 파일 색상 토큰 이관 (텍스트는 gray 스케일, 버튼/탭바/FAB 등 브랜드 표면은 primary 계열)
- 구 `accent`(파랑, 탭바+가이드 플로우 19곳) → 신규 `primary`로 전부 대체
- `.docs/DESIGN_SYSTEM.md` §1.3 정본을 신규 토큰 체계로 재작성
- (별도 커밋 권장) `DatePickerModal.tsx`, `onboarding/location.tsx`에 접근성 속성(`hitSlop`/`accessibilityLabel`) 보강

## Evidence

| AC | tsc | 스크린샷 | 회귀 |
|----|-----|----------|------|
| AC-1~13 (토큰 추가 + 전 사용처 이관 + grep 게이트) | ✅ 0 errors | 32라우트 baseline↔after 픽셀 비교, 대부분 IDENTICAL | 실시간 데이터/랜덤 요소 외 회귀 없음 |
| AC-14~15 (브랜드 컬러 값 교체 + 구 accent 이관) | ✅ 0 errors | `evidence/ac14/`, `evidence/ac15/` | `#3B82F6`/구 accent 참조 0건 |
| AC-16 (다크 variant 대비 검증) | — | `ac16-contrast-report.md` | 다크 화면 흰 라벨 1건 AA 미달(완화책 `highContrast` 정상 동작) |
| AC-17 (DESIGN_SYSTEM.md 갱신) | — | hex 자동 대조 mismatch 0건 | 대비 수치 오류 3건 발견 → Manager가 직접 수정 |
| P1-1 (홈 화면 범위 밖 색상 회귀) | ✅ 0 errors | 코드 수정 확인, 시각 확인은 스크롤 하단이라 미실시 | 원상 복구(`#B8623D`) |

## Design QA

- Alex (Design QA) verdict: **Pass @ iteration 2/3** (weighted overall 4.00/5)

## 알려진 제약 (구조적, 코드로 해결 불가)

- 시뮬레이터 터치 자동화 도구(idb/maestro) 미설치 + 접근성 권한 문제로, 이번 검증은 딥링크 네비게이션 + 스크린샷 기반으로 진행했다. pressed 상태 전환, 칩 토글, 바텀시트 드래그 같은 실제 탭 인터랙션은 정적 코드 리뷰로 대체 검증했다.
- 로그인이 필요한 일부 화면(다이어리 탭 등)은 시뮬레이터 미로그인 상태라 실데이터 렌더는 미검증.

## Open questions / 후속 권고 (Pass를 막지 않음, P2)

- 하드코딩 블루(`#60A5FA` 등) 6개 파일 잔존 — `playlist.tsx`에서 라벤더와 공존. 브랜드 일관성 차원에서 후속 스펙 권장.
- `app/(guide)/exit-summary.tsx` 체크 아이콘 대비가 다소 흐림(약 3.8:1, 아이콘 기준은 통과).
- `app/settings/delete-account.tsx` disabled 버튼 표현이 다른 화면과 살짝 다름(P2, 기능 문제 아님).

---

**확인 요청**

위 내용 기준으로 동작·UX를 한 번 봐 주세요. 특히 탭바/버튼 색이 라벤더로 바뀐 부분과, 다크 화면(가이드 플로우)에서 글자가 잘 보이는지 확인 부탁드립니다.
OK면 commit 지시를 주시면 됩니다(A/B/C 세 단위로 분리 커밋 권장 — 04-dev-notes.md 참고). 수정 원하시면 구체적으로 알려 주세요.
