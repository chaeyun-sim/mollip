#!/usr/bin/env python3
"""장소 이름이 museums에 있으면 exhibition.museum_id를 붙이고, 없으면 name만 추가한다."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from collections import defaultdict

from exhibition_sync_filters import END_DATE_MIN, _normalize, clean_exhibition_text
from fill_museum_details import fill_empty_museum_fields

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(REPO, ".env")

SKIP_VENUE_NAMES = frozenset({"", "장소 정보 없음"})
SKIP_VENUE_SUBSTRINGS = ("온라인",)


def load_env() -> dict[str, str]:
    out: dict[str, str] = {}
    if os.path.exists(ENV):
        for line in open(ENV, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip()
    return out


def venue_name_allowed(name: str) -> bool:
    cleaned = clean_exhibition_text(name)
    if _normalize(cleaned) in {_normalize(s) for s in SKIP_VENUE_NAMES}:
        return False
    if len(_normalize(cleaned)) < 2:
        return False
    return not any(s in cleaned for s in SKIP_VENUE_SUBSTRINGS)


def sb_get(path: str, base: str, key: str) -> list:
    req = urllib.request.Request(f"{base}{path}")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def sb_request(method: str, path: str, base: str, key: str, body=None, prefer: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{base}{path}", data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        return resp.status, json.loads(raw.decode()) if raw else None


def _museum_index(museums: list[dict]) -> dict[str, int]:
    index: dict[str, int] = {}
    for row in museums:
        mid = row.get("id")
        if mid is None:
            continue
        for raw in (row.get("name"), row.get("venue_group_name")):
            key = _normalize(raw or "")
            if key and key not in index:
                index[key] = mid
    return index


def _insert_museum(base: str, key: str, name: str) -> int | None:
    try:
        status, rows = sb_request(
            "POST",
            "/rest/v1/museums",
            base,
            key,
            [{"name": name}],
            prefer="return=representation",
        )
    except urllib.error.HTTPError as e:
        print(f"  museum insert failed {name[:40]}: {e.code} {e.read().decode(errors='replace')[:160]}", file=sys.stderr)
        return None
    if status not in (200, 201) or not rows:
        return None
    return rows[0].get("id")


def _link_exhibitions(base: str, key: str, museum_id: int, rows: list[dict]) -> int:
    ids = [str(r["id"]) for r in rows if r.get("museum_id") != museum_id]
    if not ids:
        return 0
    try:
        sb_request(
            "PATCH",
            f"/rest/v1/exhibitions?id=in.({','.join(ids)})",
            base,
            key,
            {"museum_id": museum_id},
            prefer="return=minimal",
        )
        return len(ids)
    except urllib.error.HTTPError as e:
        print(f"  link failed museum_id={museum_id}: {e.code}", file=sys.stderr)
        return 0


def clear_name_only_coords(base: str, key: str) -> int:
    """주소·전화·홈페이지가 없는 자동 추가 행에서 채워 둔 좌표만 비운다."""
    rows = sb_get(
        "/rest/v1/museums?select=id,address,phone,homepage_url,gps_x"
        "&address=is.null&phone=is.null&homepage_url=is.null&gps_x=not.is.null&limit=2000",
        base,
        key,
    )
    cleared = 0
    for row in rows:
        try:
            sb_request(
                "PATCH",
                f"/rest/v1/museums?id=eq.{row['id']}",
                base,
                key,
                {"gps_x": None, "gps_y": None, "synced_at": None},
                prefer="return=minimal",
            )
            cleared += 1
        except urllib.error.HTTPError as e:
            print(f"  clear gps failed id={row['id']}: {e.code}", file=sys.stderr)
    return cleared


def ensure_museums_from_exhibitions(base: str, key: str) -> tuple[int, int]:
    """이름 일치 → exhibition.museum_id. 이름 없음 → museums.name만 insert. (created, linked)"""
    exhibitions = sb_get(
        "/rest/v1/exhibitions?select=id,venue_name_fallback,museum_id"
        f"&end_date=gte.{END_DATE_MIN}&limit=2000",
        base,
        key,
    )
    museums = sb_get(
        "/rest/v1/museums?select=id,name,venue_group_name&limit=10000",
        base,
        key,
    )
    index = _museum_index(museums)
    by_venue: dict[str, list[dict]] = defaultdict(list)
    for row in exhibitions:
        name = clean_exhibition_text(row.get("venue_name_fallback") or "")
        if not venue_name_allowed(name):
            continue
        by_venue[name].append(row)

    created = 0
    linked = 0
    for name, rows in by_venue.items():
        mid = index.get(_normalize(name))
        if mid is not None:
            linked += _link_exhibitions(base, key, mid, rows)
            continue
        if _insert_museum(base, key, name) is None:
            continue
        created += 1
        print(f"  + museum {name}", file=sys.stderr)
    return created, linked


def main() -> None:
    env = load_env()
    base = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not base or not key:
        print("Need EXPO_PUBLIC_SUPABASE_URL and a Supabase key", file=sys.stderr)
        sys.exit(1)
    created, linked = ensure_museums_from_exhibitions(base, key)
    stats = fill_empty_museum_fields(base, key, env)
    print(
        f"museums created {created}, exhibitions linked {linked}, "
        f"details filled {stats['updated']}"
    )


if __name__ == "__main__":
    main()
