---
feature-slug: nearby-exhibition-alerts
author: alex
iteration: 1
verdict: Pass
---

# Design review

## Verdict

- **Pass**
- Iteration: 1 / 3

## Scores (1–5)

| Dimension            |   Score | Notes                                                      |
| -------------------- | ------: | ---------------------------------------------------------- |
| Brand & tokens       |       5 | 기존 밝은 설정 화면 및 Deep Plum 선택 상태 사용            |
| Layout & IA          |       4 | 기존 알림 행 안에 설명과 권한 흐름 배치                    |
| Copy & tone          |       5 | 위치 사용 목적, 빈도, 기기 내 처리 사실을 활성화 전에 안내 |
| Accessibility        |       4 | 표준 Switch와 기존 접근성 라벨, 권한 안내 제공             |
| **Weighted overall** | **4.5** | 고위험 권한을 사전 설명하고 선택권을 유지함                |

Pass rule: overall ≥ 4.0 and no dimension < 3.

## Previous issues addressed

- [x] 위치 사용 이유와 빈도를 켜기 전에 설명한다.
- [x] 권한 거부 시 조용히 활성화된 것처럼 보이지 않게 한다.

## Blockers (must fix)

1. None.

## Suggestions (nice to have)

1. 실제 OS 권한 흐름 및 작은 화면에서 보조 설명 줄바꿈을 확인한다.

## Handoff

- Pass → **Chris (Dev)** may start implementation.
