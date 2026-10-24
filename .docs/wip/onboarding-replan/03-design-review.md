---
feature-slug: onboarding-replan
author: alex
execution-agent: codex-independent-reviewer
execution-override: user-approved-after-claude-limit
review-cycle: independent-recheck
iteration: 2
verdict: Pass
---

# Design review — Alex 독립 재검수

## Verdict

- **G3 Pass — 4.25/5**, 수정본 직접 재확인 결과.
- Claude 주간 한도로 호출이 차단된 뒤 사용자 “너가 해도 돼!” 승인에 따라 별도 Codex 에이전트가 Alex 역할을 수행했다. Manager의 기존 Pass를 그대로 재사용하지 않았다.
- 1차 독립 검수 Fail(3.875/5) → Manager 수정 → 동일 독립 에이전트의 파일·갱신 이미지 재확인 Pass. 이번 재검수는 2회이며 이전 Manager 검수는 별도 이력으로 보존한다.
- 범위는 기획·브리프·정적 시안이다. 앱 구현·시뮬레이터 검증 통과를 의미하지 않는다.

## Scores (1–5)

| Dimension            | 1차       | 수정 후  | Notes                                                    |
| -------------------- | --------- | -------- | -------------------------------------------------------- |
| Brand & tokens       | 4.5       | 4.5      | 실제 토큰, 로컬 폰트, 금빛 액자·cream/ink 유지           |
| Layout & IA          | 3.0       | 4.0      | 극소 높이에서 숨은 벽까지 도달하는 드래그 경로 정의      |
| Copy & tone          | 4.5       | 4.5      | 16개 감상 라벨과 기존 저장/오류 문구 유지                |
| Accessibility        | 3.5       | 4.0      | 탭 배치 대상이 화면 밖이면 표시, 포커스·조작 계약 명확화 |
| **Weighted overall** | **3.875** | **4.25** | 동일 가중치 25%, 전체 ≥4.0 및 항목별 ≥3 충족             |

## Previous issues addressed

| ID  | 우선순위 | 발견 / 재현 조건                                                                                                                                                       | 수정 및 재검수                                                                                                                   |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A1  | P1       | 전체 세로 스크롤 모드에서 트레이까지 내려 벽이 화면 밖으로 사라짐. 자동 스크롤 기준이 ‘벽 상하단’이라 long press 후 수동 스크롤까지 잠기면 액자에 도달하는 경로가 없음 | 보이는 ScrollView viewport 상하단32pt 기준, offset clamp, 가시 영역 교집합 드롭 판정, 탭 배치 후 대상 reveal 명시. 브리프 재확인 |
| A2  | P2       | 벽은 원본 focus를 중앙에 놓지만 트레이는 CSS object-position을 사용해 같은 초점값에서 다른 크롭 발생                                                                   | cover 6개 × 4트레이 =24인스턴스를 원본 초점 중앙 정렬 후 clamp로 통일. HTML 및 갱신 캡처 재확인                                  |
| A3  | P2       | 장르 라벨 Medium 요구와 달리 HTML은 Regular/600만 등록, tile도 Regular                                                                                                 | 로컬 Pretendard Medium 500 등록 및 tile 적용 재확인                                                                              |

A2 초기 독립 보고의 ‘7개’는 계수 오류였으며 실제 cover 이미지 6개로 정정했다.

## Blockers (must fix)

문서·정적 시안 범위의 미해결 차단 항목 없음. 진행 중인 프로토타입의 미구현 사항은 디자인 결함과 구분한다.

## Evidence

| 검수           | 결과 / 증빙                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 시각 검수      | [final-board.png](evidence/design-review/final-board.png) Chrome 1360×2800. 독립 검수자가 갱신 이미지를 직접 열어 6개 상태·현대 로고4개·16후보 확인   |
| 정적 시안      | [02-layout-preview.html](02-layout-preview.html), 교체 선택·저장중·저장실패 포함                                                                      |
| 정적 검사      | [independent-checks.json](evidence/design-review/independent-checks.json): 로컬 이미지/폰트 참조26개 누락0, 후보16개, 대표7개, 캔버스 넘침/액자 겹침0 |
| 작은 크기 계산 | 최소 s=.24에서 액자 외접 최소 폭54.96pt/최소 높이55.44pt. 실제 글자 확대·safe area는 별도 실측 필요                                                   |
| 기획 대조      | AC1~~14 대응, 현대미술4개, 3~~5배치, 중복 방지·교체·제거·프리필·경로별 저장 계약 확인                                                                 |
| 이전 검수      | [Manager 검수 이력](evidence/design-review/manager-review-before-independent.md), [Claude 호출 차단 이력](03-alex-review-attempt.md) 보존             |
| 앱 QA          | 이번 디자인 재검수에서는 tsc·Jest·시뮬레이터 조작·회귀를 실행하지 않음. 기존 앱 baseline 결과와 구분                                                  |

## Suggestions (nice to have)

- 빠른 저장 성공으로 요약 발화가 중단되는지 G4에서 VoiceOver로 관찰한다. 이번 검수에서 임의의 8초 대기나 별도 확인 단계를 추가하지 않았다.
- 극소 높이의 자동 스크롤, 글자200%, 좌우 스크롤/길게 누르기 구분은 G4 실동작으로 검증한다.
- 정적 보드에 없는 드래그 중 강조·프리필 로딩/오류는 브리프 계약을 기준으로 프로토타입에서 확인한다.

## Handoff

- **G3 Pass → G4 최소 프로토타입 시뮬레이터 검증 재개 가능.**
- 마이페이지 → 내 취향 수정 → 전시 벽 다시 꾸미기 경로를 사용한다.
- G4/G5 미실행 항목을 본 검수 점수로 대체하지 않는다. 실제 동작·VoiceOver·회귀와 AC별 개발 검증은 후속 작업이다.
