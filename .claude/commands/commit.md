---
description: 그룹핑 → 스테이징 → 리뷰 → 버그 수정 → 커밋 루프 실행
argument-hint: '[선택: 커밋할 범위나 우선순위 설명]'
allowed-tools: Bash, Read, Edit, Grep, Glob, AskUserQuestion
---

`.docs/rules/commit-convention.md`의 "커밋 전 검증 절차"를 그대로 실행한다.

- 서브에이전트에 위임하지 말고, diff를 직접 읽어 1차 리뷰한 뒤 `/moai:review`로 2차 리뷰한다.
- 각 그룹마다: 스테이징 → `npm run format:check` → `npm run lint` → `npx tsc --noEmit` → `npm test` → 컨벤션 문서 대조 → 직접 리뷰 → `/moai:review` → 버그 있으면 수정 후 재검증 → 문제 없으면 커밋.
- 수정 판단에는 `.docs/rules/component-convention.md`, `.docs/rules/feature-pipeline.md`, `.docs/rules/commit-convention.md`를 기준으로 삼는다.
- 워킹트리에 무관한 변경이 섞여 있으면 먼저 논리적 단위로 나눈 뒤 그룹별로 이 루프를 반복한다.
- 커밋 메시지는 `.docs/rules/commit-convention.md`의 형식(`type(scope): 한글 텍스트`)을 따른다.

## 에러 핸들링

- 리뷰 중 발견한 문제가 이번 diff의 의도인지 실수인지 애매하면, 임의로 판단해서 고치거나 그냥 넘어가지 말고 멈춰서 사용자에게 확인한다.
- format/lint/tsc/test가 그룹 무관하게 이미 깨져 있었다면(다른 세션 작업 등), 이번 스테이징 탓인지 먼저 구분한다 — 무관한 기존 실패까지 이 루프에서 고치려 하지 않는다. 무관한 실패는 보고만 하고 넘어간다.
- 리뷰 중 범위 밖 코드에서 별개의 버그(예: 오래된 디버그 로그)를 발견해도 드라이브바이로 고치지 않는다 — 발견한 사실만 사용자에게 보고한다.
- 같은 그룹을 3번 이상 수정해도 검증이 안 뚫리면, 계속 반복하지 말고 멈춰서 무엇이 막혔는지 보고한다.

$ARGUMENTS
