#!/usr/bin/env python3
"""Append a pipeline event for the live board (.docs/wip/{slug}/pipeline-events.jsonl)."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
WIP_ROOT = REPO / ".docs" / "wip"

ROLES = (
    "Manager",
    "John (PM)",
    "Sam (Design)",
    "Alex (Design QA)",
    "Chris (Dev)",
    "Taylor (QA)",
    "You",
)


def emit_event(
    slug: str,
    role: str,
    body: str,
    *,
    kind: str = "message",
    gate: str | None = None,
    status: str | None = None,
    artifact: str | None = None,
    reply_to: str | None = None,
) -> dict:
    event = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "slug": slug,
        "role": role,
        "kind": kind,
        "body": body,
    }
    if gate:
        event["gate"] = gate
    if status:
        event["status"] = status
    if artifact:
        event["artifact"] = artifact
    if reply_to:
        event["reply_to"] = reply_to

    out_dir = WIP_ROOT / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = out_dir / "pipeline-events.jsonl"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")

    board_url = os.environ.get("PIPELINE_BOARD_URL", "").rstrip("/")
    if board_url:
        req = urllib.request.Request(
            f"{board_url}/api/emit",
            data=json.dumps(event).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            urllib.request.urlopen(req, timeout=5)
        except urllib.error.URLError as e:
            print(f"board notify failed: {e}", file=sys.stderr)

    return event


def main() -> None:
    p = argparse.ArgumentParser(description="Post pipeline event for mollip team board")
    p.add_argument("slug", help="feature-slug ( .docs/wip/{slug}/ )")
    p.add_argument("role", choices=ROLES, help="speaker role")
    p.add_argument("body", help="message text")
    p.add_argument("--kind", default="message", choices=("message", "status", "gate", "chat"))
    p.add_argument("--gate", help="G1..G6")
    p.add_argument("--status", help="idle|working|done|fail")
    p.add_argument("--artifact", help="related file e.g. 01-spec.md")
    p.add_argument("--reply-to", dest="reply_to", help="parent event ts (chat thread)")
    args = p.parse_args()
    ev = emit_event(
        args.slug,
        args.role,
        args.body,
        kind=args.kind,
        gate=args.gate,
        status=args.status,
        artifact=args.artifact,
        reply_to=args.reply_to,
    )
    print(json.dumps(ev, ensure_ascii=False))


if __name__ == "__main__":
    main()
