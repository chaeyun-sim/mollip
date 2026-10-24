---
feature-slug: home-discovery-sections
author: taylor
status: partial
---

# QA report

## Summary

- Tier: M · Date: 2026-10-05
- P0: 0 확인됨 / **탭·뒤로·더보기 인터랙션은 미검증** (환경 차단)

## QA checks

| Check                 | 결과                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 `npx tsc --noEmit` | ✅ 0 errors                                                                                                                                                    |
| Q2 `npx jest`         | ✅ 신규 `homeLayout.test.ts` 6/6, 앱 테스트 266 pass. ⚠️ 11 suites FAIL — 전부 `.agents/skills/claude-to-im/...` (이번 변경과 무관한 기존 실패, 건드리지 않음) |
| Q5 convention         | ✅ eslint 0 · prettier 통과 · 컴포넌트 `function`/핸들러 `handle`·이벤트 규칙, 삼항 중첩 없음(early return), import 순서                                       |
| Q6 visual             | ✅ iPhone 15(56F1783E…)에서 실제 렌더링 후 이미지 열어 확인 (아래)                                                                                             |
| Q7 interact           | ⚠️ 스크롤만 확인. 카드 탭/뒤로/더보기 **미검증**                                                                                                               |
| Q8 regress            | ⚠️ 상단 헤더·검색·히어로·FAB은 실화면에서 보존 확인. 상세·검색 이동은 미검증                                                                                   |

## 시각 확인 내역

- 상단: 헤더·검색·지도 버튼·히어로 `01/03`·FAB 유지 (초기 캡처 `evidence/00-home-top.png`).
- 인기: 톤온톤 컨테이너, 포스터 썸네일+상태+제목(2줄)+장소, 헤어라인, 이미지 없는 항목은 질문 아이콘 placeholder, 번호/아바타 없음 (수정 전 빌드 프레임에서 확인, 해당 섹션은 이후 변경 없음 — **최종 빌드 프레임은 보관하지 못함**).
- 국립: `evidence/02-national-gallery.png` — 웜 밴드, 큰 세로 포스터, 상태·Hahmlet 제목·장소, 더보기, 번호 없음, 캡션이 포스터 폭 안에 유지.
- 추천: `evidence/03-recommended-grid-2col.png`, `04-grid-odd-last-cell.png` — 2열, 제목/장소/상태 하단, 홀수 마지막 칸 왼쪽 정렬·잘림 없음. 개인화 제목 `{name}님을 위한 추천` 유지.
- 장소 없음 문구(`장소 정보 없음`)·로딩/에러/빈 상태는 코드로만 검증(실데이터에서 재현 불가).

## Findings

### P0

- 없음

### P1

- 없음(렌더링 이슈 2건은 개발 중 수정 — 04-dev-notes 참고)

### P2

- 추천 로딩 스켈레톤이 `flex-wrap`이라 1열로 보일 수 있음(시각 미확인).
- 좁은 폭(<390) 실기기/시뮬레이터 미확인 — 폭 계산은 단위 테스트(280/375/393)로만 검증.

## 미검증 / Manual QA Required

1. 섹션별 카드 탭 → 상세 → 뒤로, 국립 더보기 → `/search?q=국립` → 뒤로.
2. 최종 빌드의 인기 섹션 스크린샷 보관.
3. 스켈레톤·에러·빈 상태 시각.

**사유(환경 차단):** (a) Maestro `takeScreenshot`이 두 번 재현으로 파일을 쓰지 않음 → `simctl` 캡처 병행으로 우회. (b) 탭 플로우(`evidence/flow-taps.yaml`) 실행 직전 지정 시뮬레이터가 외부 요인으로 Shutdown 되었고, 같은 UUID를 재부팅했으나 `simctl io screenshot`이 "Timeout waiting for screen surfaces"로 실패하며 Metro 8082 리스너도 사라짐. 코드 수정으로 해결 불가 → 반복 시도 중단.

## Evidence

| ID  | Path                                                      | Description                                               |
| --- | --------------------------------------------------------- | --------------------------------------------------------- |
| E0  | `evidence/00-home-top.png`                                | 상단 보존                                                 |
| E2  | `evidence/02-national-gallery.png`                        | 국립 갤러리                                               |
| E3  | `evidence/03-recommended-grid-2col.png`                   | 추천 2열                                                  |
| E4  | `evidence/04-grid-odd-last-cell.png`                      | 홀수 마지막 칸                                            |
| F   | `evidence/flow-sections.yaml`, `flow-taps.yaml`, `cap.sh` | 단일 Maestro 플로우(스크롤 / 탭 — 탭은 미실행), 캡처 루프 |
| R   | `evidence/raw/`                                           | 캡처 원본 프레임(삭제 권한 없어 잔존, 삭제 가능)          |

## Recommendation

- [ ] Ready for Manager handoff
- [x] 인터랙션 미검증 항목은 사용자 확인 시 수동 확인 필요
