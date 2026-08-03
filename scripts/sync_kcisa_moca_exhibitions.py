#!/usr/bin/env python3
"""KCISA moca/docMeta 전시정보 → exhibitions(source=kcisa_moca) 강제 적재."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

PAGE_SIZE = 1000
DATE_RANGE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})~(\d{4})-(\d{2})-(\d{2})$")
# classify/sync_culture_exhibitions.py와 동일한 기준 — 올해 이후 종료하는 전시만 유지
END_DATE_CUTOFF = "2026.01.01"


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip().strip('"')
    return out


def fetch_page(api_key: str, page_no: int) -> tuple[list[str], int]:
    base = "https://api.kcisa.kr/openapi/service/rest/moca/docMeta"
    q = urllib.parse.urlencode(
        {"serviceKey": api_key, "numOfRows": PAGE_SIZE, "pageNo": page_no}
    )
    xml = urllib.request.urlopen(f"{base}?{q}", timeout=120).read().decode()
    total_match = re.search(r"<totalCount>(\d+)</totalCount>", xml)
    total = int(total_match.group(1)) if total_match else 0
    return re.findall(r"<item>[\s\S]*?</item>", xml), total


def fetch_exhibitions(api_key: str) -> list[dict]:
    def tag(block: str, name: str) -> str:
        m = re.search(rf"<{name}>([^<]*)</{name}>", block)
        return (m.group(1) if m else "").strip()

    seen: set[tuple[str, str, str]] = set()
    out: list[dict] = []
    page_no = 1
    while True:
        items, total = fetch_page(api_key, page_no)
        if not items:
            break
        for b in items:
            title = tag(b, "title")
            m = DATE_RANGE.match(tag(b, "eventPeriod"))
            if not title or not m:
                continue
            sy, sm, sd, ey, em, ed = m.groups()
            start_date = f"{sy}.{sm}.{sd}"
            end_date = f"{ey}.{em}.{ed}"
            if end_date < END_DATE_CUTOFF:
                continue
            key = (title, start_date, end_date)
            if key in seen:
                continue
            seen.add(key)
            charge = tag(b, "charge")
            out.append(
                {
                    "source": "kcisa_moca",
                    "venue_name_fallback": tag(b, "rights") or tag(b, "venue") or "장소 정보 없음",
                    "title": title,
                    "start_date": start_date,
                    "end_date": end_date,
                    "artist": tag(b, "person") or None,
                    "description": tag(b, "subDescription") or "",
                    "admission": "무료" if charge == "0" else (charge or "정보 없음"),
                    "admission_free": charge == "0",
                    "synced_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
                }
            )
        if page_no * PAGE_SIZE >= total:
            break
        page_no += 1
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
    api_key = env.get("EXPO_KOREAN_CONTEMPORARY_MUSEUM_API_KEY")
    sb_url = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not api_key or not sb_url or not sb_key:
        print(
            "Need EXPO_KOREAN_CONTEMPORARY_MUSEUM_API_KEY, EXPO_PUBLIC_SUPABASE_URL, SUPABASE key",
            file=sys.stderr,
        )
        sys.exit(1)

    rows = fetch_exhibitions(api_key)
    print(f"fetched {len(rows)} exhibitions (end_date >= {END_DATE_CUTOFF}, deduped by title+dates)")

    sb_request("DELETE", "/rest/v1/exhibitions?source=eq.kcisa_moca", sb_url, sb_key)
    inserted = 0
    skipped_conflict = 0
    batch = 100
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        try:
            sb_request("POST", INSERT_PATH, sb_url, sb_key, chunk, prefer=INSERT_PREFER)
            inserted += len(chunk)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            # 다른 source와 UNIQUE(title,start_date,end_date) 충돌 시 ignore-duplicates —
            # 배치 단위로 한 건씩 재시도
            if e.code != 409:
                print(body, file=sys.stderr)
                raise
            for row in chunk:
                try:
                    sb_request("POST", INSERT_PATH, sb_url, sb_key, [row], prefer=INSERT_PREFER)
                    inserted += 1
                except urllib.error.HTTPError as row_err:
                    if row_err.code == 409:
                        skipped_conflict += 1
                        continue
                    print(row_err.read().decode(errors="replace"), file=sys.stderr)
                    raise
    print(f"insert attempted {inserted} rows, skipped (duplicate with other source) {skipped_conflict}")

    meta = {
        "source": "kcisa_moca",
        "synced_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    }
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
            "/rest/v1/data_sync_meta?source=eq.kcisa_moca",
            sb_url,
            sb_key,
            {"synced_at": meta["synced_at"]},
        )
    print("done — check exhibitions where source=kcisa_moca")


if __name__ == "__main__":
    main()
