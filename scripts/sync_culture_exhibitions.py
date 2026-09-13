#!/usr/bin/env python3
"""문화포털 period2 전시 → exhibitions(source=culture) 강제 적재 (SERVICE_ROLE 권장)."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

from exhibition_sync_filters import (
    END_DATE_MIN,
    clean_exhibition_text,
    end_date_eligible,
    title_key,
    venue_sync_allowed,
)
from ensure_museums import ensure_museums_from_exhibitions
from fill_museum_details import fill_empty_museum_fields

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

# classify script와 동일한 period 상수
FROM = "20260101"
PERIOD_TO = "29991231"
PAGE_SIZE = 1000
MAX_PAGES = 50


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def tag(block: str, name: str) -> str:
    m = re.search(rf"<{name}>([^<]*)</{name}>", block)
    return (m.group(1) if m else "").strip()


def fetch_period_page(api_key: str, page_no: int, attempts: int = 3) -> str:
    base = "https://apis.data.go.kr/B553457/cultureinfo/period2"
    q = urllib.parse.urlencode(
        {
            "serviceKey": api_key,
            "PageNo": page_no,
            "numOfrows": PAGE_SIZE,
            "sortStdr": 1,
            "from": FROM,
            "to": PERIOD_TO,
            "serviceTp": "A",
        }
    )
    url = f"{base}?{q}"
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return urllib.request.urlopen(url, timeout=120).read().decode()
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_error = e
            print(f"period2 page {page_no} attempt {attempt}/{attempts} failed: {e}", file=sys.stderr)
    raise last_error if last_error else RuntimeError("period2 fetch failed")


def parse_total_count(xml: str) -> int:
    m = re.search(r"<totalCount>(\d+)</totalCount>", xml)
    return int(m.group(1)) if m else 0


def fetch_exhibitions(api_key: str) -> tuple[list[dict], dict[str, tuple[str, str]]]:
    seen: set[str] = set()
    out: list[dict] = []
    venue_gps: dict[str, tuple[str, str]] = {}
    skipped_end = 0
    skipped_venue = 0
    pages = 0
    total = 0

    for page_no in range(1, MAX_PAGES + 1):
        xml = fetch_period_page(api_key, page_no)
        if page_no == 1:
            total = parse_total_count(xml)
        blocks = re.findall(r"<item>[\s\S]*?</item>", xml)
        pages += 1
        print(f"period2 page {page_no}: {len(blocks)} items", file=sys.stderr)

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
            end_date = f"{ed[:4]}.{ed[4:6]}.{ed[6:8]}"
            if not end_date_eligible(end_date):
                skipped_end += 1
                continue
            place = clean_exhibition_text(tag(b, "place") or "")
            title = clean_exhibition_text(tag(b, "title"))
            if not title:
                continue
            if not venue_sync_allowed(place, title):
                skipped_venue += 1
                continue
            entry: dict = {
                "source": "culture",
                "venue_name_fallback": place or "장소 정보 없음",
                "title": title,
                "start_date": f"{sd[:4]}.{sd[4:6]}.{sd[6:8]}",
                "end_date": end_date,
                "synced_at": __import__("datetime").datetime.now(
                    __import__("datetime").timezone.utc
                ).isoformat(),
            }
            # null일 때 payload에서 제외 → merge-duplicates 시 기존 image_url 보존
            if thumbnail := tag(b, "thumbnail"):
                entry["image_url"] = thumbnail
            gx, gy = tag(b, "gpsX"), tag(b, "gpsY")
            if place and gx and gy:
                try:
                    if float(gx) != 0 and float(gy) != 0:
                        venue_gps.setdefault(place, (gx, gy))
                except ValueError:
                    pass
            out.append(entry)

        if len(blocks) < PAGE_SIZE:
            break
        if total and page_no * PAGE_SIZE >= total:
            break

    print(f"period2 pages={pages} totalCount={total or '?'}", file=sys.stderr)
    if skipped_end or skipped_venue:
        print(
            f"filtered out: end_date<{END_DATE_MIN} → {skipped_end}, venue blocklist → {skipped_venue}",
            file=sys.stderr,
        )
    return out, venue_gps


def dedupe_by_title(rows: list[dict]) -> list[dict]:
    """같은 제목은 이미지 있는 행, 더 늦은 마감일 순으로 하나만 남긴다."""
    best: dict[str, dict] = {}
    for row in rows:
        key = title_key(row["title"])
        if not key:
            continue
        prev = best.get(key)
        if prev is None or _is_better_title_row(row, prev):
            best[key] = row
    return list(best.values())


def _is_better_title_row(row: dict, prev: dict) -> bool:
    row_img = 1 if row.get("image_url") else 0
    prev_img = 1 if prev.get("image_url") else 0
    if row_img != prev_img:
        return row_img > prev_img
    if row["end_date"] != prev["end_date"]:
        return row["end_date"] > prev["end_date"]
    return row["start_date"] >= prev["start_date"]


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


def sb_get(path: str, base: str, key: str) -> list:
    req = urllib.request.Request(f"{base}{path}")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


SOURCE_RANK = {
    "manual": 0,
    "kcisa_moca": 1,
    "sac": 1,
    "kcisa": 1,
    "culture": 2,
}


def existing_title_keys(base: str, key: str) -> set[str]:
    q = "/rest/v1/exhibitions?select=title&end_date=gte." + END_DATE_MIN + "&limit=2000"
    return {title_key(r.get("title") or "") for r in sb_get(q, base, key)} - {""}


def drop_known_titles(rows: list[dict], taken: set[str]) -> tuple[list[dict], int]:
    kept: list[dict] = []
    skipped = 0
    for row in rows:
        key = title_key(row["title"])
        if key in taken:
            skipped += 1
            continue
        kept.append(row)
    return kept, skipped


def prune_duplicate_titles(base: str, key: str) -> int:
    rows = sb_get(
        "/rest/v1/exhibitions?select=id,source,title,end_date,image_url"
        f"&end_date=gte.{END_DATE_MIN}&limit=2000",
        base,
        key,
    )
    groups: dict[str, list[dict]] = {}
    for row in rows:
        key_name = title_key(row.get("title") or "")
        if not key_name:
            continue
        groups.setdefault(key_name, []).append(row)
    to_delete: list[int] = []
    for group in groups.values():
        if len(group) < 2:
            continue
        keeper = min(
            group,
            key=lambda r: (
                SOURCE_RANK.get(r.get("source") or "", 9),
                0 if r.get("image_url") else 1,
                r.get("id") or 0,
            ),
        )
        for row in group:
            if row["id"] != keeper["id"]:
                to_delete.append(row["id"])
    if not to_delete:
        return 0
    for row_id in to_delete:
        sb_request("DELETE", f"/rest/v1/exhibitions?id=eq.{row_id}", base, key)
    return len(to_delete)


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

    rows, venue_gps = fetch_exhibitions(data_key)
    rows = dedupe_by_title(rows)
    taken = existing_title_keys(sb_url, sb_key)
    rows, skipped_existing = drop_known_titles(rows, taken)
    print(
        f"fetched {len(rows)} exhibitions (serviceName=전시, end_date >= {END_DATE_MIN}, "
        f"deduped by title, skipped existing names {skipped_existing})"
    )

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
    pruned = prune_duplicate_titles(sb_url, sb_key)
    print(f"pruned duplicate titles {pruned}")
    created, linked = ensure_museums_from_exhibitions(sb_url, sb_key)
    print(f"museums created {created}, exhibitions linked {linked}")
    stats = fill_empty_museum_fields(sb_url, sb_key, env)
    print(f"museum details filled {stats['updated']}")
    meta = {"source": "culture_period_v3", "synced_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()}
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
            "/rest/v1/data_sync_meta?source=eq.culture_period_v3",
            sb_url,
            sb_key,
            {"synced_at": meta["synced_at"]},
        )
    print("done — check exhibitions where source=culture")


if __name__ == "__main__":
    main()
