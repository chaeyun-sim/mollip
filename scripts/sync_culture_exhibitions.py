#!/usr/bin/env python3
"""문화포털 period2 전시 → exhibitions(source=culture) 강제 적재 (SERVICE_ROLE 권장)."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

# classify script와 동일한 period 상수
FROM = "20260101"
PERIOD_TO = "29991231"
PAGE_SIZE = 1000


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def fetch_exhibitions(api_key: str) -> list[dict]:
    base = "https://apis.data.go.kr/B553457/cultureinfo/period2"
    q = urllib.parse.urlencode(
        {
            "serviceKey": api_key,
            "PageNo": 1,
            "numOfrows": PAGE_SIZE,
            "sortStdr": 1,
            "from": FROM,
            "to": PERIOD_TO,
            "serviceTp": "A",
        }
    )
    xml = urllib.request.urlopen(f"{base}?{q}", timeout=120).read().decode()
    blocks = re.findall(r"<item>[\s\S]*?</item>", xml)

    def tag(block: str, name: str) -> str:
        m = re.search(rf"<{name}>([^<]*)</{name}>", block)
        return (m.group(1) if m else "").strip()

    seen: set[str] = set()
    out: list[dict] = []
    for b in blocks:
        if tag(b, "serviceName") != "전시":
            continue
        seq = tag(b, "seq")
        if not seq or seq in seen:
            continue
        seen.add(seq)
        sd, ed = tag(b, "startDate"), tag(b, "endDate")
        if len(sd) != 8 or len(ed) != 8:
            continue
        out.append(
            {
                "source": "culture",
                "venue_name_fallback": tag(b, "place") or "장소 정보 없음",
                "title": tag(b, "title"),
                "start_date": f"{sd[:4]}.{sd[4:6]}.{sd[6:8]}",
                "end_date": f"{ed[:4]}.{ed[4:6]}.{ed[6:8]}",
                "image_url": tag(b, "thumbnail") or None,
                "synced_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            }
        )
    return out


def dedupe_by_title_dates(rows: list[dict]) -> list[dict]:
    seen: set[tuple[str, str, str]] = set()
    out: list[dict] = []
    for row in rows:
        key = (row["title"], row["start_date"], row["end_date"])
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def sb_request(method: str, path: str, base: str, key: str, body=None, prefer: str | None = None):
    url = f"{base}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    elif body is not None and method == "POST":
        req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.status


INSERT_PATH = "/rest/v1/exhibitions?on_conflict=title,start_date,end_date"
INSERT_PREFER = "resolution=ignore-duplicates,return=minimal"


def main() -> None:
    env = load_env()
    data_key = env.get("EXPO_PUBLIC_DATA_KEY")
    sb_url = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not data_key or not sb_url or not sb_key:
        print("Need EXPO_PUBLIC_DATA_KEY, EXPO_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(1)

    rows = dedupe_by_title_dates(fetch_exhibitions(data_key))
    print(f"fetched {len(rows)} exhibitions (serviceName=전시, deduped by title+dates)")

    sb_request("DELETE", "/rest/v1/exhibitions?source=eq.culture", sb_url, sb_key)
    inserted = 0
    skipped_conflict = 0
    batch = 100
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        try:
            sb_request(
                "POST",
                INSERT_PATH,
                sb_url,
                sb_key,
                chunk,
                prefer=INSERT_PREFER,
            )
            inserted += len(chunk)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            # manual/kcisa와 UNIQUE 충돌 시 ignore-duplicates — 배치 단위로 한 건씩 재시도
            if e.code != 409:
                print(body, file=sys.stderr)
                raise
            for row in chunk:
                try:
                    sb_request(
                        "POST",
                        INSERT_PATH,
                        sb_url,
                        sb_key,
                        [row],
                        prefer=INSERT_PREFER,
                    )
                    inserted += 1
                except urllib.error.HTTPError as row_err:
                    if row_err.code == 409:
                        skipped_conflict += 1
                        continue
                    print(row_err.read().decode(errors="replace"), file=sys.stderr)
                    raise
    print(f"insert attempted {inserted} rows, skipped (duplicate with manual/kcisa) {skipped_conflict}")
    meta = {"source": "culture_period_v2", "synced_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()}
    req = urllib.request.Request(
        f"{sb_url}/rest/v1/data_sync_meta",
        data=json.dumps(meta).encode(),
        method="POST",
        headers={
            "apikey": sb_key,
            "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError:
        sb_request(
            "PATCH",
            "/rest/v1/data_sync_meta?source=eq.culture_period_v2",
            sb_url,
            sb_key,
            {"synced_at": meta["synced_at"]},
        )
    print("done — check exhibitions where source=culture")


if __name__ == "__main__":
    main()
