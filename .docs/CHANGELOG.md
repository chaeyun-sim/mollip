# 하네스 변경 이력 (전체 정본)

하네스(CLAUDE.md · `.claude/agents/` · `.claude/skills/` · `.claude/rules/` · 훅)의 전체 변경 이력.
CLAUDE.md에는 최근 5행만 유지하고, 행이 밀려나면 이 파일로 이관한다 (이관 시 내용 수정 금지 — append-only).

| 날짜       | 변경 내용                                                                                                 | 대상                            | 사유                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-25 | 문서 지도 3개 목록을 표로 변경, 하네스 변경 이력 섹션 신설                                                | CLAUDE.md, `.docs/CHANGELOG.md` | 정본 이력 분리로 CLAUDE.md 비대화 방지                                                                                    |
| 2026-08-25 | `.docs/templates/feature/`의 07-handoff-to-user.md를 06으로 복구, 고아 파일 06-unit-test-engineer.md 삭제 | `.docs/templates/feature/`      | harness 스킬 감사에서 발견 — AGENTS.md/agents/rules 전부 06-handoff-to-user.md를 참조하는데 템플릿만 번호가 어긋나 있었음 |
| 2026-08-25 | 하네스 파일 변경 자동 감지 → CHANGELOG.md 로깅 hook 추가 (`handle-harness-changelog.sh`) | `.claude/settings.json`, `.claude/hooks/moai/` | 사용자 요청 — 하네스 변경 시 수동 이관을 잊지 않도록 자동 기록 |
| 2026-08-25 | chris.md/taylor.md 입력 섹션에 tier S(01-spec·02-design-brief·04-dev-notes 부재) 조건 명시, taylor.md Q4를 tier S용으로 분기 | `.claude/agents/chris.md`, `.claude/agents/taylor.md` | harness 드라이런 테스트에서 발견 — tier S 실행 시 존재하지 않는 파일을 무조건 참조하는 dead link 위험 |

## 자동 감지 로그 (하네스 파일 변경 — 사유 미기재)

하네스 관련 파일이 수정될 때마다 hook이 기계적으로 남기는 로그. 사유는 세션에서 위 정본 표로 옮길 때 채운다.

| 일시 | 파일 | 도구 |
| ---- | ---- | ---- |
