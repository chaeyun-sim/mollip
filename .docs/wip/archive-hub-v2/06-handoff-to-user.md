---
feature-slug: archive-hub-v2
author: manager
status: pending-user
---

# Handoff — 아카이브 허브 v2

## 한 줄 요약

아카이브 탭을 **관람 요약 히어로 + 최근 관람 + 개선된 empty/login** 구조로 새로 짰습니다. 데이터·일기 상세 플로우는 그대로입니다.

## 산출물

| 단계 | 파일 |
|------|------|
| Spec | `.docs/wip/archive-hub-v2/01-spec.md` |
| Design | `02-design-brief.md`, `03-design-review.md` |
| Dev | `04-dev-notes.md` + `app/(tabs)/archive.tsx` 등 |
| QA | `05-qa-report.md` |

## 팀 보드 보는 법

1. `python3 tools/pipeline-board/serve.py`
2. 브라우저 **http://127.0.0.1:8765** → slug `archive-hub-v2`
3. **7칸**(Manager · John · Sam · Alex · Chris · Taylor · You)이 항상 보입니다.
4. 재연출: `PIPELINE_BOARD_URL=http://127.0.0.1:8765 ./scripts/pipeline_team_demo.sh archive-hub-v2`

## 확인 부탁 (G6)

- [ ] 로그인 후 아카이브: 히어로 숫자·세그먼트·달력
- [ ] 기록 없을 때 empty CTA
- [ ] 비로그인: 로그인 유도 (null 화면 아님)

승인 / 수정 요청 알려주세요.
