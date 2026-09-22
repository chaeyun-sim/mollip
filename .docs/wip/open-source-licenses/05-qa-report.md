---
feature-slug: open-source-licenses
author: taylor
status: complete
---

# QA report

## Summary

- P0: 0 required for handoff — 0 found
- Tier: M
- Date: 2026-09-21

## QA checks

- Q1: TypeScript compilation — `npx tsc --noEmit` (최종본 기준 재실행) → **0 errors**
- Q2: Automated tests — `npm test` → **26 suites / 252 tests pass** (최종본 기준 재실행)
- Q3: Functional correctness — Maestro + 시뮬레이터 실기기 인터랙션으로 AC-1~AC-6 전부 실측
- Q4: UX — 기존 처리방침/약관 화면과 시각적으로 동일한 톤, 접근성 라벨 상태별 분기 확인
- Q5: Convention — component-convention.md §9.3(서브컴포넌트 파일 분리), §6(handle~/on~ 네이밍), §12(import 순서) 준수 확인
- Q6: Visual fidelity — 시뮬레이터 스크린샷으로 접힘/펼침/스크롤/뒤로가기/인접화면 전 상태 실측
- Q7: Interaction — 실제 탭(계정 정보 아님, 오픈소스 라이선스 행/아코디언/GitHub 링크/뒤로가기/인접 카드) 시뮬레이터 실행 확인
- Q8: Regression — 개인정보 처리방침·서비스 이용약관 화면 진입/렌더링 확인
- Q9: Performance — 해당 없음(정적 텍스트 렌더링, 별도 성능 측정 불필요 — 관찰 결과 프레임 드랍 없음)

## AC matrix

| AC   | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact | Q8 regress | Q9 perf |
| ---- | ------ | ------- | ------ | ----- | ------- | --------- | ----------- | ---------- | ------- |
| AC-1 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |
| AC-2 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |
| AC-3 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |
| AC-4 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |
| AC-5 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |
| AC-6 | ✅     | ✅      | ✅     | ✅    | ✅      | ✅        | ✅          | ✅         | N/A     |

## Findings

### P0 (ship blocker)

- (없음)

### P1

- (없음)

### P2

- (없음, 참고사항은 아래 "환경 관찰" 참고)

## Evidence

실제 검증은 iOS 시뮬레이터(iPhone 17, iOS 26.5) + 설치된 dev-client 빌드(`com.simune.mollip`) + Metro(`npx expo start --dev-client`)로 수행. 도구: Maestro 2.9.0 (`~/.maestro/bin/maestro`, PATH 미등록 상태였음 — `export PATH="$HOME/.maestro/bin:$PATH"`로 실행). Maestro 플로우 파일은 QA 완료 후 임시 스크래치로 삭제를 시도했으나 `rm` 명령이 권한 승인 대기로 차단되어 저장소에 `e2e/tmp-qa-open-source-license.yaml`로 여전히 남아 있음 — Manager 최종 보고에 명시.

| ID  | Path                                                                    | Description                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `/tmp/tsc_final.txt`                                                    | 최종본 `npx tsc --noEmit` 출력 (0 errors, empty)                                                                                                                                    |
| E2  | `/tmp/jest_final.txt`                                                   | 최종본 `npm test` 출력 (26 suites / 252 tests pass)                                                                                                                                 |
| E3  | Maestro 실행 로그 (본 대화 tool 출력)                                   | `maestro test e2e/tmp-qa-open-source-license.yaml` 전체 스텝 COMPLETED (2026-09-21_181349 run)                                                                                      |
| E4  | `~/.maestro/tests/2026-09-21_181349/.../tmp-qa-01-mypage-guest-top.png` | 게스트 상태 마이페이지 최상단 — "오픈소스 라이선스" 행이 "개인정보 처리방침" 바로 아래, "버전" 위에 위치 (AC-1)                                                                     |
| E5  | `~/.maestro/tests/.../tmp-qa-02-mypage-guest-scrolled.png`              | 게스트 스크롤 후 "버전"까지 도달 (AC-6, `scrollEnabled` 버그 수정 확인)                                                                                                             |
| E6  | `~/.maestro/tests/.../tmp-qa-03-license-collapsed.png`                  | 라이선스 화면 진입 직후 "[폰트] Pretendard" 접힘 상태(chevron-down)만 노출 (AC-2, AC-4 기본 접힘)                                                                                   |
| E7  | `~/.maestro/tests/.../tmp-qa-04-license-expanded.png`                   | 아코디언 탭 후 펼침 — 라이선스명, GitHub 링크(아이콘+화살표), 저작권 고지 4건, SIL OFL 전문 시작(PREAMBLE) 노출                                                                     |
| E8  | `~/.maestro/tests/.../tmp-qa-04b-github-inapp-browser.png`              | GitHub 링크 탭 → 실제 `github.com/orioncactus/pretendard/blob/main/LICENSE` 페이지가 인앱 브라우저(SFSafariViewController)로 열림 (AC-5), 104줄/4.7KB로 우리가 임베드한 원문과 일치 |
| E9  | `/tmp/qa4_scroll_state.png`                                             | 인앱 브라우저 닫은 뒤 스크롤 재개 → 라이선스 전문 마지막 줄("OTHER DEALINGS IN THE FONT SOFTWARE.")까지 정상 렌더링                                                                 |
| E10 | `~/.maestro/tests/.../tmp-qa-06-license-collapsed-again.png`            | 아코디언 재탭 → 접힘 복귀, "PREAMBLE" 등 전문 텍스트 모두 언마운트 확인 (accessibilityState 토글 정합성)                                                                            |
| E11 | `~/.maestro/tests/.../tmp-qa-07-back-to-settings.png`                   | 뒤로가기 → 설정 화면 복귀, 하단 탭바 "마이페이지" 하이라이트 정상 (AC-3)                                                                                                            |
| E12 | `~/.maestro/tests/.../tmp-qa-08-privacy-policy.png`                     | 인접 화면 회귀 — 개인정보 처리방침 정상 렌더링                                                                                                                                      |
| E13 | `~/.maestro/tests/.../tmp-qa-09-terms.png`                              | 인접 화면 회귀 — 서비스 이용약관 정상 렌더링                                                                                                                                        |
| E14 | 본 대화 Node 스크립트 출력                                              | `src/data/licenses.ts`에 임베드된 PRETENDARD_LICENSE 상수와 `curl`로 받은 원본 raw 파일이 바이트 단위로 `identical: true` (raw/embedded length 4816 == 4816)                        |

## Regression paths walked

1. 마이페이지(게스트) → 오픈소스 라이선스 → 뒤로가기 → 개인정보 처리방침 → 뒤로가기 → 서비스 이용약관 → 뒤로가기 → 오픈소스 라이선스 행 재확인
2. 게스트 스크롤: 최상단 → "버전"까지 (AC-6 회귀 확인, 수정 전에는 `scrollEnabled={!!session}`로 인해 게스트가 도달 불가능했던 경로)

## 환경 관찰 (스코프 밖, Manager 보고용)

- 하단 탭바 "마이페이지" 아이콘 좌표 탭이 이번 개발 세션(AppleScript 좌표 클릭 + Maestro 좌표/텍스트 탭 양쪽 모두)에서 반응하지 않는 현상 발견. `app/(tabs)/_layout.tsx`는 표준 expo-router `Tabs`이며 이번 변경과 무관. 딥링크(`mollip://settings`)로 우회 시 정상 진입하고, 진입 후 탭바 하이라이트도 "마이페이지"로 정확히 반영됨(E11) — 실제 네비게이션 로직은 정상. Metro/dev-client 세션 상태에 기인한 것으로 추정되며, 코드 수정으로 재현·해결을 시도하지 않았다(스코프 밖). 사용자가 실기기/새 빌드에서 재현되지 않으면 무시 가능.
- `e2e/tmp-qa-open-source-license.yaml` 삭제 시도가 `rm` 권한 승인 대기로 차단됨 — 저장소에 미삭제 상태로 남아 있음 (untracked, `git status`에서 `??`로만 표시, 커밋 대상 아님). 수동 삭제 필요: `rm e2e/tmp-qa-open-source-license.yaml`.

## Return reason

- [ ] Functional
- [ ] Visual
- [ ] Interaction
- [ ] Performance
- [ ] Regression
- [ ] Convention
- [ ] Other

(해당 없음 — 전 항목 Pass)

## Recommendation

- [x] Ready for Manager handoff
- [ ] Return to Chris (Dev)
