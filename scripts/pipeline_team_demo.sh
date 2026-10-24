#!/usr/bin/env bash
# Replay a full team sequence on the pipeline board (each role speaks as themselves).
set -euo pipefail
SLUG="${1:-archive-hub-v2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
emit() {
  python3 "$ROOT/scripts/pipeline_emit.py" "$@"
}

export PIPELINE_BOARD_URL="${PIPELINE_BOARD_URL:-http://127.0.0.1:8765}"

emit "$SLUG" "Manager" "아카이브 허브 v2 — 팀 가동" --kind status --status working
emit "$SLUG" "John (PM)" "Problem/Goals 정리 → 01-spec.md (tier L, AC 6개)" --kind message --artifact 01-spec.md
emit "$SLUG" "John (PM)" "① 기획 단계 통과" --kind gate --gate G1 --status done --artifact 01-spec.md
emit "$SLUG" "Sam (Design)" "히어로·세그먼트·empty copy → 02-design-brief.md" --kind message --artifact 02-design-brief.md
emit "$SLUG" "Sam (Design)" "② 디자인 브리프 확정" --kind gate --gate G2 --status done --artifact 02-design-brief.md
emit "$SLUG" "Alex (Design QA)" "4.4/5 Pass — dev 진행 OK" --kind message --artifact 03-design-review.md
emit "$SLUG" "Alex (Design QA)" "③ 디자인 검수 통과" --kind gate --gate G3 --status done --artifact 03-design-review.md
emit "$SLUG" "Chris (Dev)" "AC-1~6 구현 완료" --kind status --status done
emit "$SLUG" "Taylor (QA)" "타입·테스트·화면 확인 끝 (치명 버그 없음)" --kind status --status working
emit "$SLUG" "Taylor (QA)" "⑤ 개발·검증 단계 통과" --kind gate --gate G5 --status done --artifact 05-qa-report.md
emit "$SLUG" "Manager" "⑥ 사용자 확인 대기 — handoff 올림" --kind gate --gate G6 --status working --artifact 06-handoff-to-user.md
emit "$SLUG" "You" "최종 확인 부탁드려요 🙏" --kind message

echo "Done. Open http://127.0.0.1:8765 and select slug=$SLUG"
