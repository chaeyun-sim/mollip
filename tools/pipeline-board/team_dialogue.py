"""Synthesize team chat replies from WIP artifacts + pipeline events (no LLM)."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

WIP = Path(__file__).resolve().parents[2] / ".docs" / "wip"

ROLES_ORDER = (
    "Manager",
    "John (PM)",
    "Sam (Design)",
    "Alex (Design QA)",
    "Chris (Dev)",
    "Taylor (QA)",
    "You",
)

WORKER_ROLES = (
    "John (PM)",
    "Sam (Design)",
    "Alex (Design QA)",
    "Chris (Dev)",
    "Taylor (QA)",
)

GATE_ARTIFACTS = {
    "G1": "01-spec.md",
    "G2": "02-design-brief.md",
    "G3": "03-design-review.md",
    "G4": "(prototype)",
    "G5": "05-qa-report.md",
    "G6": "06-handoff-to-user.md",
}

# 사용자-facing 쉬운 말 (G1~G6는 내부 단계 번호)
GATE_LABELS: dict[str, tuple[str, str]] = {
    "G1": ("① 기획", "무엇을 만들지·완료 기준을 문서로 정리"),
    "G2": ("② 디자인", "화면 톤·카피·레이아웃을 디자인 브리프로 정리"),
    "G3": ("③ 디자인 검수", "디자인이 기획·브랜드에 맞는지 Alex가 확인"),
    "G4": ("④ 시뮬 확인", "시뮬레이터에서 화면·동작을 한번 훑어봄"),
    "G5": ("⑤ 개발·검증", "개발 후 타입·테스트·화면 확인까지 (치명 버그 0개)"),
    "G6": ("⑥ 사용자 OK", "완료 보고 후, 사용자(당신) 최종 확인"),
}

STATUS_KO = {
    "done": "완료",
    "working": "진행 중",
    "pending": "아직",
    "fail": "다시 필요",
}

ROLE_ALIASES: dict[str, str] = {
    "manager": "Manager",
    "매니저": "Manager",
    "john": "John (PM)",
    "pm": "John (PM)",
    "sam": "Sam (Design)",
    "design": "Sam (Design)",
    "alex": "Alex (Design QA)",
    "qa-design": "Alex (Design QA)",
    "chris": "Chris (Dev)",
    "dev": "Chris (Dev)",
    "taylor": "Taylor (QA)",
    "qa": "Taylor (QA)",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_events(slug: str) -> list[dict]:
    path = WIP / slug / "pipeline-events.jsonl"
    if not path.is_file():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            import json

            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def _wip_path(slug: str) -> Path | None:
    if ".." in slug or "/" in slug:
        return None
    d = (WIP / slug).resolve()
    if not str(d).startswith(str(WIP.resolve())):
        return None
    return d


def _artifact_exists(slug: str, name: str) -> bool:
    d = _wip_path(slug)
    return bool(d and (d / name).is_file())


def _count_acs(slug: str) -> int | None:
    d = _wip_path(slug)
    if not d:
        return None
    spec = d / "01-spec.md"
    if not spec.is_file():
        return None
    text = spec.read_text(encoding="utf-8")
    return len(re.findall(r"^### AC-\d+", text, re.MULTILINE))


def _gate_state(events: list[dict]) -> dict[str, str]:
    gates: dict[str, str] = {}
    for ev in events:
        if ev.get("kind") == "gate" and ev.get("gate"):
            g = ev["gate"]
            gates[g] = ev.get("status") or "done"
    return gates


def _last_by_role(events: list[dict]) -> dict[str, dict]:
    last: dict[str, dict] = {}
    for ev in events:
        role = ev.get("role")
        if role:
            last[role] = ev
    return last


def _event(
    slug: str,
    role: str,
    body: str,
    *,
    kind: str = "chat",
    reply_to: str | None = None,
    artifact: str | None = None,
) -> dict:
    ev: dict = {
        "ts": _now_iso(),
        "slug": slug,
        "role": role,
        "kind": kind,
        "body": body,
    }
    if reply_to:
        ev["reply_to"] = reply_to
    if artifact:
        ev["artifact"] = artifact
    return ev


def build_progress_summary(slug: str) -> str:
    events = _read_events(slug)
    gates = _gate_state(events)
    acs = _count_acs(slug)
    lines = [f"📋 「{slug}」 지금 어디까지 왔는지", ""]

    for g in ("G1", "G2", "G3", "G4", "G5", "G6"):
        st = gates.get(g, "pending")
        title, desc = GATE_LABELS[g]
        st_ko = STATUS_KO.get(st, st)
        art = GATE_ARTIFACTS[g]
        file_ok = _artifact_exists(slug, art) if art.endswith(".md") else None
        doc = ""
        if file_ok is True:
            doc = " · 문서 있음"
        elif file_ok is False:
            doc = " · 문서 아직 없음"
        icon = "✅" if st == "done" else ("🔄" if st == "working" else ("❌" if st == "fail" else "⬜"))
        lines.append(f"{icon} {title} — {st_ko}")
        lines.append(f"   {desc}{doc}")

    if acs is not None:
        lines.extend(["", f"완료해야 할 기능 묶음(AC): {acs}개 (기획서 기준)"])

    present = [f for f in GATE_ARTIFACTS.values() if f.endswith(".md") and _artifact_exists(slug, f)]
    lines.extend(["", f"작성된 문서: {len(present)}개 / 6"])
    return "\n".join(lines)


def _role_status_line(slug: str, role: str, last: dict | None) -> str:
    if not last:
        if role == "John (PM)" and _artifact_exists(slug, "01-spec.md"):
            return "01-spec 작성됨 — 이벤트 로그는 아직 없어요."
        return "아직 로그 없음 — 대기 중이에요."
    body = (last.get("body") or "")[:120]
    st = last.get("status")
    st_ko = STATUS_KO.get(st or "", st) if st else ""
    prefix = f"({st_ko}) " if st_ko else ""
    return prefix + body


def generate_standup(slug: str, reply_to: str | None = None) -> list[dict]:
    if reply_to:
        return team_banter(slug, reply_to)
    opener_ts = _now_iso()
    return team_banter(slug, opener_ts)


def parse_mention(text: str) -> str | None:
    m = re.search(r"@([\w가-힣\-]+)", text, re.IGNORECASE)
    if not m:
        return None
    key = m.group(1).lower()
    return ROLE_ALIASES.get(key) or ROLE_ALIASES.get(key.replace("-", ""))


def build_brief_status(slug: str) -> str:
    events = _read_events(slug)
    gates = _gate_state(events)
    done = sum(1 for g in GATE_LABELS if gates.get(g) == "done")
    pending = [g for g in GATE_LABELS if gates.get(g, "pending") not in ("done", "fail")]
    if not pending:
        pending = ["G6"]
    ng = pending[0]
    title, desc = GATE_LABELS[ng]
    last = _last_by_role(events)
    extra = ""
    for role in ("Chris (Dev)", "Taylor (QA)", "Sam (Design)"):
        ev = last.get(role)
        if ev and ev.get("body"):
            extra = f"\n• {role.split()[0]}: {ev['body'][:70]}"
            break
    return f"「{slug}」 {done}/6 단계 완료. 지금은 {title} 쪽이에요.\n{desc}{extra}"


def _short(role: str) -> str:
    return role.split()[0] if role else role


def is_team_idle(last: dict[str, dict]) -> bool:
    """No worker role is actively `working` (Manager waiting on G6 counts as idle)."""
    for role in WORKER_ROLES:
        ev = last.get(role)
        if ev and ev.get("status") == "working":
            return False
    return True


def rest_casual_status(
    slug: str,
    role: str,
    gates: dict[str, str],
    last: dict | None,
) -> str:
    if role == "John (PM)":
        if gates.get("G1") == "done":
            return "기획은 끝 — 지금은 쉬는 중 ☕"
        return "할당된 작업 없어서 대기 중~"
    if role == "Sam (Design)":
        if gates.get("G2") == "done":
            return "브리프까지 끝, 손 놨어 ☕"
        return "디자인 할 일 없어서 쉬는 중"
    if role == "Alex (Design QA)":
        if gates.get("G3") == "done":
            return "검수 Pass 했어 — 지금은 휴식 ☕"
        return "검수 대기라 쉬는 중"
    if role == "Chris (Dev)":
        if gates.get("G5") == "done" or (last and last.get("status") == "done"):
            return "구현·QA까지 끝 — 쉬는 중 ☕"
        return "개발 손 댈 게 없어서 대기 중"
    if role == "Taylor (QA)":
        if gates.get("G5") == "done":
            return "QA 리포트까지 끝, 쉬는 중 ☕"
        return "검증할 게 없어서 대기 중"
    return "쉬는 중 ☕"


def casual_status(
    slug: str,
    role: str,
    gates: dict[str, str],
    last: dict | None,
) -> str | None:
    if role == "John (PM)":
        if gates.get("G1") == "done":
            return "01-spec.md에 AC까지 정리해 뒀어 ✓"
        if _artifact_exists(slug, "01-spec.md"):
            return "기획서 다듬는 중~ 곧 통과 찍을게"
        return "다음 스프린트 기획 준비하고 있어"
    if role == "Sam (Design)":
        if gates.get("G2") == "done":
            return "02-design-brief.md 올려뒀어 — Alex 검수 들어가면 돼"
        if gates.get("G1") == "done" or _artifact_exists(slug, "01-spec.md"):
            return "John 기획 받았어, 화면·카피 잡는 중"
        return "기획 오면 바로 브리프 그릴게~"
    if role == "Alex (Design QA)":
        if gates.get("G3") == "done":
            return "03-design-review.md Pass 찍었어 — Chris 개발 GO"
        if _artifact_exists(slug, "02-design-brief.md"):
            return "Sam 브리프 보고 검수표 채우는 중"
        return "검수 대기 중이야"
    if role == "Chris (Dev)":
        if gates.get("G5") == "done":
            return "코드·04-dev-notes.md 반영 끝 — Taylor QA 중"
        if last and last.get("status") == "done":
            return "맡은 AC 구현 끝! QA만 남았어"
        if last and last.get("status") == "working":
            b = (last.get("body") or "")[:60]
            return f"코드 올리는 중… {b}" if b else "지금 구현 중!"
        if gates.get("G3") == "done":
            return "디자인 OK 받아서 AC 하나씩 개발 중"
        return "개발 대기 — 디자인 검수만 기다리는 중"
    if role == "Taylor (QA)":
        if gates.get("G5") == "done":
            return "05-qa-report.md 올렸어 — 타입·테스트·화면 OK ✓"
        if last and last.get("status") == "working":
            return "지금 시뮬 돌려보면서 검증 중~"
        if gates.get("G3") == "done":
            return "Chris 개발 올라오면 바로 검증할게"
        return "QA 준비돼 있어, 개발만 오면 돼"
    return None


def artifact_handoffs(slug: str, gates: dict[str, str]) -> list[tuple[str, str | None]]:
    """Pipeline 산출물(문서·코드) 인계 — 채팅 멘트 relay 아님."""
    chain: list[tuple[str, str, str, str | None, str]] = [
        ("G1", "John", "Sam", "01-spec.md", "기획 스펙"),
        ("G2", "Sam", "Alex", "02-design-brief.md", "디자인 브리프"),
        ("G3", "Alex", "Chris", "03-design-review.md", "디자인 검수(Pass)"),
        ("G5", "Chris", "Taylor", "04-dev-notes.md", "구현 코드 + 개발 노트"),
        ("G5", "Taylor", "Manager", "05-qa-report.md", "QA 리포트"),
        ("G6", "Manager", "당신", "06-handoff-to-user.md", "최종 핸드오프"),
    ]
    out: list[tuple[str, str | None]] = []
    for gate, a, b, art, label in chain:
        if gates.get(gate) != "done":
            continue
        if art:
            ok = _artifact_exists(slug, art)
            pending = "" if ok else " (WIP 폴더에 아직 없음)"
            body = f"📎 {a} → {b}: {label} · `{art}`{pending}"
            out.append((body, art if ok else None))
        else:
            out.append((f"📎 {a} → {b}: {label}", None))
    return out


def team_banter(slug: str, user_ts: str) -> list[dict]:
    events = _read_events(slug)
    gates = _gate_state(events)
    last = _last_by_role(events)
    if is_team_idle(last):
        out: list[dict] = [
            _event(
                slug,
                "Manager",
                "지금 돌아가는 작업 없어 — 팀은 잠깐 쉬는 중이야 ☕",
                reply_to=user_ts,
            ),
        ]
        rid = out[0]["ts"]
        for role in ROLES_ORDER:
            if role in ("Manager", "You"):
                continue
            out.append(
                _event(slug, role, rest_casual_status(slug, role, gates, last.get(role)), reply_to=rid),
            )
        return out
    out = [
        _event(slug, "Manager", "오케이, 친구들 각자 한마디~", reply_to=user_ts),
    ]
    rid = out[0]["ts"]
    for role in ROLES_ORDER:
        if role in ("Manager", "You"):
            continue
        line = casual_status(slug, role, gates, last.get(role))
        if line:
            out.append(_event(slug, role, line, reply_to=rid))
    if len(out) == 1:
        out.append(_event(slug, "Manager", build_brief_status(slug), reply_to=rid))
    return out


def _conversational_replies(slug: str, msg: str, user_ts: str) -> list[dict]:
    events = _read_events(slug)
    last = _last_by_role(events)
    brief = build_brief_status(slug)

    if re.search(r"뭐해|뭐하|모해|뭐하고|busy|doing", msg, re.I):
        return team_banter(slug, user_ts)

    if re.search(r"전달|넘겼|핸드오프|handoff|산출물|문서|파일|인계", msg, re.I):
        events = _read_events(slug)
        gates = _gate_state(events)
        handoffs = artifact_handoffs(slug, gates)
        if not handoffs:
            return [
                _event(
                    slug,
                    "Manager",
                    "아직 단계 통과 로그가 없어서 인계된 산출물이 없어 — 조금만 기다려!",
                    reply_to=user_ts,
                )
            ]
        intro = _event(
            slug,
            "Manager",
            "지금까지 넘어간 건 말이 아니라 문서·코드야 👇",
            reply_to=user_ts,
        )
        replies = [intro]
        for body, art in handoffs[-6:]:
            replies.append(_event(slug, "Manager", body, reply_to=user_ts, artifact=art))
        return replies

    if re.search(r"안녕|하이|hello|반가|하세요", msg, re.I):
        return [_event(slug, "Manager", f"안녕하세요!\n{brief}", reply_to=user_ts)]

    if re.search(r"고마|감사|thank", msg, re.I):
        return [
            _event(
                slug,
                "Manager",
                f"천천히 확인해 주세요.\n{brief}",
                reply_to=user_ts,
            )
        ]

    if re.search(r"\?|뭐야|무슨|설명|help|도와", msg, re.I):
        return [
            _event(
                slug,
                "Manager",
                f"{brief}\n\n특정 사람한테 물으려면 @Chris 처럼 멘션해 주세요.",
                reply_to=user_ts,
            )
        ]

    return [_event(slug, "Manager", brief, reply_to=user_ts)]


def generate_replies(slug: str, user_message: str, user_ts: str) -> list[dict]:
    msg = user_message.strip()
    lower = msg.lower()
    mention = parse_mention(msg)

    if mention and mention != "Manager":
        events = _read_events(slug)
        gates = _gate_state(events)
        last = _last_by_role(events).get(mention)
        line = casual_status(slug, mention, gates, last)
        if not line:
            line = _role_status_line(slug, mention, last)
            persona = _short(mention)
            if "아직 로그 없음" in line:
                line = f"나 {persona}! 아직 이 기능 로그엔 없어 — 곧 올릴게"
        art = None
        if mention == "John (PM)":
            art = "01-spec.md" if _artifact_exists(slug, "01-spec.md") else None
        elif mention == "Sam (Design)":
            art = "02-design-brief.md" if _artifact_exists(slug, "02-design-brief.md") else None
        elif mention == "Chris (Dev)":
            art = "04-dev-notes.md" if _artifact_exists(slug, "04-dev-notes.md") else None
        return [_event(slug, mention, line, reply_to=user_ts, artifact=art)]

    triggers_progress = any(
        k in lower or k in msg
        for k in ("현황", "진도", "progress", "status", "어디", "얼마나", "상황")
    )
    triggers_standup = any(k in lower or k in msg for k in ("스탠드업", "standup", "회의"))

    if triggers_standup:
        return generate_standup(slug, reply_to=user_ts)

    if triggers_progress or mention == "Manager":
        summary = build_progress_summary(slug)
        replies = [_event(slug, "Manager", summary, reply_to=user_ts)]
        last = _last_by_role(_read_events(slug))
        working = [r for r, ev in last.items() if ev.get("status") == "working" and r not in ("You", "Manager")]
        if working:
            names = ", ".join(r.split()[0] for r in working)
            replies.append(
                _event(
                    slug,
                    "Manager",
                    f"지금 손보는 중: {names}",
                    reply_to=user_ts,
                )
            )
        return replies

    return _conversational_replies(slug, msg, user_ts)
