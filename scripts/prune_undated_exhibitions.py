#!/usr/bin/env python3
"""start/end 가 비었거나 YYYY.MM.DD 가 아닌 exhibitions 정리.

- description 에 명확한 기간(YYYY.MM.DD ~ YYYY.MM.DD)이 있으면 UPDATE
- 그 외 kcisa/manual 은 DELETE (culture 는 sync 단계에서 날짜 필수)
- 실행: python3 scripts/prune_undated_exhibitions.py [--apply]
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

DATE_RE = re.compile(r"^\d{4}\.\d{2}\.\d{2}$")
# description / title 에서 기간 추출
DESC_RANGE = re.compile(
    r"(20\d{2}|19\d{2})\.(\d{1,2})\.(\d{1,2})\s*[~\-–~부터\s]+\s*(20\d{2}|19\d{2})\.(\d{1,2})\.(\d{1,2})"
)
DESC_RANGE2 = re.compile(
    r"(20\d{2}|19\d{2})\.(\d{1,2})\.(\d{1,2})\s+(20\d{2}|19\d{2})\.(\d{1,2})\.(\d{1,2})"
)


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip().strip('"')
    return out


def fmt(y: str, m: str, d: str) -> str:
    return f"{int(y):04d}.{int(m):02d}.{int(d):02d}"


def valid_pair(sd: str, ed: str) -> bool:
    return bool(DATE_RE.match(sd.strip()) and DATE_RE.match(ed.strip()))


def parse_from_text(text: str) -> tuple[str, str] | None:
    if not text:
        return None
    plain = re.sub(r"<[^>]+>", " ", text)
    for pat in (DESC_RANGE, DESC_RANGE2):
        m = pat.search(plain)
        if m:
            sd = fmt(m.group(1), m.group(2), m.group(3))
            ed = fmt(m.group(4), m.group(5), m.group(6))
            if valid_pair(sd, ed):
                return sd, ed
    return None


def normalize_row_dates(sd: str, ed: str) -> tuple[str, str]:
    sd, ed = (sd or "").strip(), (ed or "").strip()
    if not ed and " " in sd:
        parts = sd.split()
        if len(parts) >= 2 and DATE_RE.match(parts[0]) and DATE_RE.match(parts[1]):
            return parts[0], parts[1]
    sd = re.sub(r"\s+\d{2}:\d{2}:\d{2}\s*$", "", sd).strip()
    ed = re.sub(r"\s+\d{2}:\d{2}:\d{2}\s*$", "", ed).strip()
    return sd, ed


def sb(env: dict[str, str], method: str, path: str, body=None):
    base = env["EXPO_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env["EXPO_PUBLIC_SUPABASE_ANON_KEY"]
    url = base + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.status


def fetch_all(env: dict[str, str]) -> list[dict]:
    base = env["EXPO_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env["EXPO_PUBLIC_SUPABASE_ANON_KEY"]
    rows: list[dict] = []
    off = 0
    while True:
        path = (
            "/rest/v1/exhibitions?select=id,source,title,start_date,end_date,description"
            f"&limit=1000&offset={off}"
        )
        req = urllib.request.Request(
            base + path,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        batch = json.loads(urllib.request.urlopen(req, timeout=120).read())
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < 1000:
            break
        off += 1000
    return rows


def main() -> None:
    apply = "--apply" in sys.argv
    env = load_env()
    if not env.get("EXPO_PUBLIC_SUPABASE_URL"):
        print("Missing EXPO_PUBLIC_SUPABASE_URL", file=sys.stderr)
        sys.exit(1)

    rows = fetch_all(env)
    to_update: list[tuple[int, str, str]] = []
    to_delete: list[int] = []
    kept = 0

    for r in rows:
        src = r.get("source") or ""
        if src == "culture":
            sd, ed = normalize_row_dates(r.get("start_date", ""), r.get("end_date", ""))
            if valid_pair(sd, ed):
                kept += 1
                continue
            print(f"[culture invalid — skip auto-delete] id={r['id']} {r.get('title','')[:40]}")
            continue

        sd, ed = normalize_row_dates(r.get("start_date", ""), r.get("end_date", ""))
        if valid_pair(sd, ed):
            if sd != r.get("start_date") or ed != r.get("end_date"):
                to_update.append((r["id"], sd, ed))
            else:
                kept += 1
            continue

        desc = r.get("description") or ""
        title = r.get("title") or ""
        parsed = parse_from_text(desc) or parse_from_text(title)
        if parsed:
            to_update.append((r["id"], parsed[0], parsed[1]))
            continue

        # description 에도 기간 없음 → 아카이브/옛 카탈로그로 보고 삭제
        to_delete.append(r["id"])

    print(f"total={len(rows)} keep_valid={kept} update={len(to_update)} delete={len(to_delete)}")
    if to_delete[:5]:
        print("delete sample ids:", to_delete[:5])
    if not apply:
        print("Dry run. Pass --apply to write.")
        return

    for rid, sd, ed in to_update:
        q = urllib.parse.urlencode({"id": f"eq.{rid}"})
        sb(
            env,
            "PATCH",
            f"/rest/v1/exhibitions?{q}",
            {"start_date": sd, "end_date": ed},
        )

    chunk = 80
    for i in range(0, len(to_delete), chunk):
        ids = to_delete[i : i + chunk]
        id_list = ",".join(str(x) for x in ids)
        sb(env, "DELETE", f"/rest/v1/exhibitions?id=in.({id_list})")

    print("Done.")


if __name__ == "__main__":
    main()
