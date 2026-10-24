---
feature-slug: main-editorial-redesign
author: alex
iteration: 1
verdict: Pass
---

# Design review

## Verdict

- **Pass**
- Iteration: 1 / 3

## Scores (1–5)

| Dimension            | Score | Notes                                                                                                                                      |
| -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand & tokens       | 4     | 새 색상 없이 기존 토큰만으로 위계 구성, Hahmlet 세리프 활용도 상승                                                                         |
| Layout & IA          | 4     | 정보 구조 자체가 카드 나열형→인덱스/커버스토리형으로 바뀌는 실질적 재설계. 데이터 순서는 유지해 사용자 혼란 최소화                         |
| Copy & tone          | 4     | eyebrow 카피(COVER STORY, EXPLORE)가 기존 톤(전시를 발견하고...)과 살짝 톤 차이 있으나 매거진 컨셉과 일관되어 허용 범위                    |
| Accessibility        | 4     | 룰선/넘버는 장식으로 처리, 기존 accessibilityLabel 유지 방침 명확. 히어로 이미지-텍스트 겹침은 실제 겹침 아닌 여백 확보로 리스크 완화 명시 |
| **Weighted overall** | 4.0   | Pass 기준 충족                                                                                                                             |

Pass rule: overall ≥ 4.0 and no dimension &lt; 3.

## Blockers (must fix)

- 없음

## Suggestions (nice to have)

1. AC-2(히어로) 구현 시 이전 작업에서 겪은 "타이틀 줄바꿈 회귀"가 재발할 가능성이 가장 높음 — Chris는 이미지 절대배치 전에 텍스트만 먼저 스크린샷으로 2줄 고정을 확인한 뒤 이미지를 얹을 것.
2. AC-4 인덱스 리스트가 항목 수에 따라 스크롤이 길어질 수 있으니 최대 노출 개수(기존처럼 리드 1 + 나머지 최대 4개 정도)를 유지할 것.

## Handoff

- Pass → **Chris (Dev)**가 구현 시작 (AC-1 → AC-2 → AC-3 → AC-4 → AC-5 순, 하나씩, 매 AC마다 스크린샷 확인)
