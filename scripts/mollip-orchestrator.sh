#!/bin/bash

set -e

FEATURE="$1"

if [ -z "$FEATURE" ]; then
  echo "사용법: ./scripts/mollip-orchestrator.sh <feature-slug>"
  exit 1
fi

WIP=".docs/wip/$FEATURE"

echo "======================================"
echo " Mollip Agent Orchestrator"
echo " Feature: $FEATURE"
echo "======================================"

run_claude() {
  local PROMPT="$1"

  echo ""
  echo "🤖 Claude 실행"
  echo "--------------------------------------"

  claude "$PROMPT"
}

run_codex() {
  local PROMPT="$1"

  echo ""
  echo "🧠 Codex 실행"
  echo "--------------------------------------"

  codex "$PROMPT"
}

# 1. PM
run_codex "
너는 John(PM)이다.

AGENTS.md와 .docs/rules/feature-pipeline.md를 읽어라.

기능:
$FEATURE

요구사항을 분석하고 새로운 기획과 Acceptance Criteria를 작성하라.

결과물을 다음 위치에 작성하라:
$WIP/01-spec.md

완료되면 작업을 종료하라.
"

# 2. Design
run_claude "
너는 Sam(Design)이다.

AGENTS.md와 .docs/rules/feature-pipeline.md를 읽어라.

다음 기획을 기준으로 작업하라:
$WIP/01-spec.md

디자인 계획을 작성하고 다음 파일에 저장하라:
$WIP/02-design-brief.md

완료되면 작업을 종료하라.
"

# 3. Design QA
run_codex "
너는 Alex(Design QA)다.

AGENTS.md와 .docs/rules/feature-pipeline.md를 읽어라.

다음 문서를 기준으로 디자인 QA를 수행하라:
$WIP/01-spec.md
$WIP/02-design-brief.md

디자인 시스템, 요구사항/AC, UX, 접근성을 검수하라.

결과를 다음 파일에 작성하라:
$WIP/03-design-review.md

Pass/Fail과 구체적인 수정사항을 명확히 기록하라.

Fail이면 Sam이 수정할 수 있도록 수정 요구사항을 작성하라.
"

# 4. Design revision
if grep -qi "fail" "$WIP/03-design-review.md"; then
  run_claude "
너는 Sam(Design)이다.

다음 문서를 읽어라:
$WIP/01-spec.md
$WIP/02-design-brief.md
$WIP/03-design-review.md

Alex의 Design QA 결과를 반영하여 디자인 브리프를 수정하라.

수정된 내용을:
$WIP/02-design-brief.md

에 반영하라.

완료되면 종료하라.
"
fi

# 5. Development
run_claude "
너는 Chris(Dev)다.

AGENTS.md와 .docs/rules/feature-pipeline.md를 읽어라.

다음 문서를 기준으로 개발하라:
$WIP/01-spec.md
$WIP/02-design-brief.md
$WIP/03-design-review.md

Acceptance Criteria를 하나씩 구현하라.

구현 결과와 개발 기록을:
$WIP/04-dev-notes.md

에 작성하라.

완료되면 종료하라.
"

# 6. QA
run_codex "
너는 Taylor(QA)다.

AGENTS.md와 .docs/rules/feature-pipeline.md를 읽어라.

다음 문서를 기준으로 구현 결과를 검증하라:
$WIP/01-spec.md
$WIP/02-design-brief.md
$WIP/04-dev-notes.md

Acceptance Criteria를 하나씩 검증하라.

tsc, 테스트, 비주얼, 인터랙션, 회귀를 확인하라.

결과를:
$WIP/05-qa-report.md

에 작성하라.

문제가 있으면 구체적인 수정 요구사항을 기록하라.
"

# 7. QA 실패 → Claude 수정
if grep -qi "fail" "$WIP/05-qa-report.md"; then
  run_claude "
너는 Chris(Dev)다.

Taylor의 QA 결과를 확인하라:
$WIP/05-qa-report.md

관련 기획과 디자인 문서도 확인하라:
$WIP/01-spec.md
$WIP/02-design-brief.md

QA에서 발견된 모든 문제를 수정하라.

수정 내용을:
$WIP/04-dev-notes.md

에 반영하라.

완료되면 종료하라.
"

  # 8. 재검증
  run_codex "
너는 Taylor(QA)다.

이전 QA에서 발견된 문제를 중심으로 다시 검증하라.

기획:
$WIP/01-spec.md

디자인:
$WIP/02-design-brief.md

개발:
$WIP/04-dev-notes.md

기존 QA:
$WIP/05-qa-report.md

검증 결과를 $WIP/05-qa-report.md 에 갱신하라.

모든 문제가 해결되었는지 확인하라.
"
fi

# 9. Manager
run_claude "
너는 Manager다.

전체 파이프라인을 최종 검수하라.

다음 문서를 모두 확인하라:
$WIP/01-spec.md
$WIP/02-design-brief.md
$WIP/03-design-review.md
$WIP/04-dev-notes.md
$WIP/05-qa-report.md

실제 코드 변경사항도 확인하라.

모든 AC가 충족되었고 QA가 통과했는지 확인하라.

최종 결과를:
$WIP/06-handoff-to-user.md

에 작성하라.

사용자에게 최종 확인이 필요한 경우에만 명시하라.
"

echo ""
echo "======================================"
echo "✅ $FEATURE 파이프라인 완료"
echo "======================================"